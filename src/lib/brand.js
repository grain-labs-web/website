// Render the supplied wordmark in browser-generated cards; no guessed logo font.
let markPromise;
export function prepareBrandMark() {
  if (!markPromise) markPromise = (async () => {
    const image = new Image(); image.src = '/assets/packaging-alternate.png'; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 652; canvas.height = 120;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image,125,220,326,60,0,0,652,120);
    const pixels = ctx.getImageData(0,0,652,120);
    for (let i=0;i<pixels.data.length;i+=4) {
      const alpha=Math.max(0,Math.min(1,1.5-2*pixels.data[i+1]/255));
      pixels.data[i]=173;pixels.data[i+1]=23;pixels.data[i+2]=94;pixels.data[i+3]=Math.round(alpha*255);
    }
    ctx.putImageData(pixels,0,0);return canvas;
  })().catch(() => {markPromise=null;return null;});
  return markPromise;
}
