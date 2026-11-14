import test from 'node:test';
import assert from 'node:assert/strict';
import { initPackViewer } from '../src/lib/pack-viewer.js';

test('a device without WebGL retains usable front, back and reset controls', async () => {
  const image = { alt: '' }, artwork = { className: '' };
  const fallback = { hidden: true, querySelector: s => s === 'img' ? image : artwork };
  const canvas = { hidden: false, getContext: () => null };
  const control = () => ({ attrs: {}, setAttribute(key,value) { this.attrs[key]=value; } });
  const front=control(),back=control(),reset=control(),status={};
  await initPackViewer({canvas,fallback,status,front,back,reset});
  assert.equal(canvas.hidden,true);assert.equal(fallback.hidden,false);
  assert.equal(front.attrs['aria-pressed'],'true');
  back.onclick();assert.equal(back.attrs['aria-pressed'],'true');assert.match(image.alt,/back/);assert.match(artwork.className,/back-art/);
  reset.onclick();assert.equal(front.attrs['aria-pressed'],'true');assert.match(artwork.className,/front-art/);
});
