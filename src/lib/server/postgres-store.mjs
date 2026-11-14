import pg from 'pg';

// Isolated schemas prevent sandbox payments from entering live fulfilment.
export async function openPostgresStore(connectionString, schema) {
  if (!/^grainlabs_(local|test|live|qa_[a-z0-9_]+)$/.test(schema)) throw new Error('Invalid order schema.');
  const url = new URL(connectionString);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('Invalid database configuration.');
  // Set TLS explicitly: sslmode in the URI would otherwise override these options.
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert', 'channel_binding']) url.searchParams.delete(key);
  const pool = new pg.Pool({ connectionString: url.href, ssl: { rejectUnauthorized: true }, enableChannelBinding: true,
    max: 5, connectionTimeoutMillis: 15000, idleTimeoutMillis: 30000, statement_timeout: 15000 });
  pool.on('error', () => console.error('Database connection interrupted; no credentials logged.'));
  const qualify = sql => {
    let parameter = 0;
    const ignore = sql.startsWith('INSERT OR IGNORE');
    return sql.replace('INSERT OR IGNORE', 'INSERT').replace(/\b(orders|events|notifications|payment_attempts)\b/g, name => `"${schema}"."${name}"`)
      .replace(/\?/g, () => `$${++parameter}`) + (ignore ? ' ON CONFLICT DO NOTHING' : '');
  };
  const rows = result => result.rows.map(row => {
    for (const key of ['created', 'next_attempt', 'recorded', 'n']) if (typeof row[key] === 'string' && /^\d+$/.test(row[key])) row[key] = Number(row[key]);
    return row;
  });
  const statements = client => ({ prepare(sql) {
    const query = (...values) => client.query(qualify(sql), values);
    return { get: async (...values) => rows(await query(...values))[0], all: async (...values) => rows(await query(...values)),
      run: async (...values) => ({ changes: (await query(...values)).rowCount }) };
  }, lock: key => client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [key]) });
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "${schema}".orders (
        id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, fingerprint TEXT NOT NULL, customer TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20), amount INTEGER NOT NULL CHECK(amount > 0),
        shipping INTEGER NOT NULL CHECK(shipping >= 0), provider_id TEXT UNIQUE, payment_id TEXT,
        status TEXT NOT NULL, created BIGINT NOT NULL, checked BIGINT NOT NULL DEFAULT 0);
      ALTER TABLE "${schema}".orders ADD COLUMN IF NOT EXISTS checked BIGINT NOT NULL DEFAULT 0;
      CREATE TABLE IF NOT EXISTS "${schema}".events (id TEXT PRIMARY KEY, payment_id TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS "${schema}".notifications (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES "${schema}".orders(id),
        status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, next_attempt BIGINT NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS "${schema}".payment_attempts (id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES "${schema}".orders(id),
        payment_id TEXT NOT NULL, status TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL, recorded BIGINT NOT NULL);
      CREATE INDEX IF NOT EXISTS notifications_due ON "${schema}".notifications(status,next_attempt);
      CREATE INDEX IF NOT EXISTS events_pending ON "${schema}".events(done);
      CREATE INDEX IF NOT EXISTS payment_attempts_order ON "${schema}".payment_attempts(order_id);
    `);
  } catch { await pool.end(); throw new Error('Database setup failed. Check server-only connection settings and database permissions.'); }
  return { ...statements(pool), dialect: 'postgres', schema,
    async transaction(callback) {
      const client = await pool.connect();
      try { await client.query('BEGIN'); const result = await callback(statements(client)); await client.query('COMMIT'); return result; }
      catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    async health() {
      const client = await pool.connect();
      try { await client.query('SELECT 1'); return { connected: true, tls: client.connection.stream.encrypted === true, certificateVerified: client.connection.stream.authorized === true, schema }; }
      finally { client.release(); }
    }, close: () => pool.end() };
}

// SQLite stays available for offline unit tests; serialize operations around async transactions.
const sqliteAdapters = new WeakMap();
export function asyncSqliteStore(db) {
  if (sqliteAdapters.has(db)) return sqliteAdapters.get(db);
  let tail = Promise.resolve();
  function serial(callback) { const result = tail.then(callback); tail = result.catch(() => {}); return result; }
  const adapter = { prepare(sql) { const statement = db.prepare(sql); return Object.fromEntries(['get', 'all', 'run'].map(method => [method, (...values) => serial(() => statement[method](...values))])); },
    transaction: callback => serial(async () => {
      db.exec('BEGIN IMMEDIATE');
      try { const result = await callback({ prepare: sql => db.prepare(sql), lock: async () => {} }); db.exec('COMMIT'); return result; }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    }) };
  sqliteAdapters.set(db, adapter); return adapter;
}
