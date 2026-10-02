// Real browser-side VTracer adapter. No Netlify Functions, no remote image upload.
// Local build installs vendor/vtracer/index.js, worker.js and vtracer_bg.wasm.
let tracerPromise;
async function getTracer(){
 if(!tracerPromise)tracerPromise=import('./vendor/vtracer/index.js').then(({createVTracer})=>createVTracer()).catch(e=>{tracerPromise=null;throw e});
 return tracerPromise;
}
window.MuralBrowserTracer={
 async convertPixels(pixels,width,height,options){
  if(!(pixels instanceof Uint8ClampedArray) && !(pixels instanceof Uint8Array))throw new TypeError('RGBA buffer required');
  if(pixels.length!==width*height*4)throw new RangeError('RGBA buffer dimensions mismatch');
  const tracer=await getTracer();
  return tracer.convertPixels(pixels,width,height,options);
 },
 async reset(){if(tracerPromise){(await tracerPromise).terminate();tracerPromise=null;}}
};
