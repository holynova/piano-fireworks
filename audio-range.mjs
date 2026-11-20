// Workers Static Assets may return a full M4A for Range requests.
// Only the small, bundled concert recordings run through this handler.
export default {
  async fetch(request,env){
    if(!new URL(request.url).pathname.endsWith('.m4a'))return env.ASSETS.fetch(request);
    const headers=new Headers(request.headers);
    const range=headers.get('Range');
    headers.delete('Range');
    const asset=await env.ASSETS.fetch(new Request(request,{headers}));
    if(asset.status!==200 || !['GET','HEAD'].includes(request.method))return asset;
    const responseHeaders=new Headers(asset.headers);
    responseHeaders.set('Accept-Ranges','bytes');
    const match=/^bytes=(\d*)-(\d*)$/.exec(range||'');
    const ifRange=request.headers.get('If-Range');
    if(request.method==='HEAD'||!match||(!match[1]&&!match[2])||
      (ifRange && ifRange!==asset.headers.get('ETag') && ifRange!==asset.headers.get('Last-Modified'))){
      return new Response(asset.body,{status:200,headers:responseHeaders});
    }
    const data=await asset.arrayBuffer(),size=data.byteLength;
    const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
    const end=match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
    if(start>end||start>=size){
      responseHeaders.set('Content-Range','bytes */'+size);
      responseHeaders.set('Content-Length','0');
      return new Response(null,{status:416,headers:responseHeaders});
    }
    responseHeaders.set('Content-Range',`bytes ${start}-${end}/${size}`);
    responseHeaders.set('Content-Length',String(end-start+1));
    return new Response(new Uint8Array(data,start,end-start+1),{status:206,headers:responseHeaders});
  }
};
