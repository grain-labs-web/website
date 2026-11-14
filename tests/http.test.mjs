import test from 'node:test';
import assert from 'node:assert/strict';
import {rawBody,checkWrite,api} from '../src/lib/server/http.js';
test('Next route body preserves signed webhook bytes and enforces streamed size limits',async()=>{
  const raw=' { "payment": "signed bytes" }\n';
  const request=new Request('http://localhost/api/razorpay/webhook',{method:'POST',body:raw});
  assert.equal((await rawBody(request)).toString(),raw);
  await assert.rejects(rawBody(new Request('http://localhost/api/orders',{method:'POST',body:'x'.repeat(65537)})),error=>error.status===413);
});
test('Next route writes require the configured origin and errors do not expose secrets',async()=>{
  assert.throws(()=>checkWrite(new Request('http://localhost/api/orders',{method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},body:'{}'})),error=>error.status===403);
  const response=await api(async()=>{throw new Error('private-database-credential');})();
  assert.equal(response.status,500);assert.doesNotMatch(await response.text(),/private-database-credential/);
});
