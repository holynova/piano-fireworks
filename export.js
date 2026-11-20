// Frame-by-frame export uses a separate canvas and copies the original AAC packets.
window.exportConcert=async function(track,config,signal,onProgress){
  function script(src){
    return new Promise((resolve,reject)=>{
      const el=document.createElement('script');el.src=src;
      el.onload=()=>{resolve(el.pianoAudio);el.remove()};
      el.onerror=()=>{el.remove();reject(new Error('未能读取 '+src))};
      document.head.append(el);
    });
  }
  if(!window.VideoEncoder)throw new Error('此浏览器缺少视频编码器，请用桌面 Chrome、Edge 或 Safari 打开。');
  if(!window.Mediabunny)await script('vendor/mediabunny/mediabunny-1.66.2.min.js');
  const M=window.Mediabunny,width=1280,height=720,fps=30,bitrate=4000000;
  const supported=await M.canEncodeVideo('avc',{width,height,bitrate,frameRate:fps});
  if(!supported)throw new Error('当前浏览器无法编码 H.264，请使用支持 H.264 编码的浏览器。');
  signal.throwIfAborted();
  let bytes;
  if(location.protocol==='file:'){
    const packed=await script('music/export/'+track.id+'.js');
    if(Uint8Array.fromBase64)bytes=Uint8Array.fromBase64(packed);
    else{
      const binary=atob(packed);bytes=new Uint8Array(binary.length);
      for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    }
  }else{
    const response=await fetch(track.src,{signal});
    if(!response.ok)throw new Error('未能读取演奏音轨。');
    bytes=await response.arrayBuffer();
  }
  signal.throwIfAborted();
  const input=new M.Input({formats:[M.MP4],source:new M.BufferSource(bytes)});
  const output=new M.Output({format:new M.Mp4OutputFormat(),target:new M.BufferTarget()});
  try{
    const source=await input.getPrimaryAudioTrack(),decoderConfig=await source.getDecoderConfig();
    const canvas=document.createElement('canvas'),stage=new FireworkStage(canvas,{width,height});
    stage.select(track,config);
    const intro=config.launch?Math.max(0,-stage.script.firstLaunch-config.offset/1000):0;
    const video=new M.CanvasSource(canvas,{codec:'avc',bitrate,keyFrameInterval:2});
    const audio=new M.EncodedAudioPacketSource('aac');
    output.addVideoTrack(video,{frameRate:fps});output.addAudioTrack(audio);
    await output.start();
    const titleSeconds=3, closingSeconds=4;
    const musicStart=titleSeconds+intro;
    const musicEnd=musicStart+await source.computeDuration();
    const duration=musicEnd+closingSeconds;
    const titleCard=concertCard(track,false,width,height);
    const closingCard=concertCard(track,true,width,height);
    const packets=new M.EncodedPacketSink(source).packets();
    let packet=await packets.next(),meta={decoderConfig};
    const frames=Math.ceil(duration*fps);
    for(let i=0;i<frames;i++){
      signal.throwIfAborted();
      const time=i/fps;
      while(!packet.done && packet.value.timestamp+musicStart<time+1/fps){
        const sample=packet.value;
        await audio.add(sample.clone({timestamp:sample.timestamp+musicStart}),meta);
        meta=undefined;packet=await packets.next();
      }
      if(time<titleSeconds)stage.ctx.drawImage(titleCard,0,0);
      else if(time<musicEnd)stage.render(time-musicStart);
      else stage.ctx.drawImage(closingCard,0,0);
      await video.add(time,Math.min(1/fps,duration-time));
      if(i%8===0){
        onProgress(Math.floor(i/frames*100));
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }
    audio.close();video.close();await output.finalize();
    signal.throwIfAborted();
    return new Blob([output.target.buffer],{type:'video/mp4'});
  }finally{
    input.dispose();
    if(output.state==='started')await output.cancel();
  }
};

function concertCard(track,closing,width,height){
  const canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height;
  const g=canvas.getContext('2d'),{url,modules}=ProjectLink;
  const sky=g.createLinearGradient(0,0,width,height);
  sky.addColorStop(0,'#0b111d');sky.addColorStop(1,'#242631');
  g.fillStyle=sky;g.fillRect(0,0,width,height);
  g.fillStyle='#deb784';g.font='27px system-ui';g.fillText('花火琴房',86,138);
  g.fillRect(86,175,52,2);
  g.fillStyle='#f4efe4';g.font='600 58px "Songti SC","Noto Serif CJK SC",serif';
  g.fillText(closing?'演出落幕':track.title,82,346,745);
  g.fillStyle='#c6c8d0';g.font='28px system-ui';
  g.fillText(closing?'扫码，在浏览器里听下一首':[track.composer,track.instrument||'钢琴',track.mark].join('  ·  '),86,417,740);
  if(closing){g.fillStyle='#edd1a7';g.font='25px system-ui';g.fillText(url,86,553,730)}
  // Integer-sized modules and a four-module quiet zone survive H.264 encoding.
  const cell=7,size=(modules.length+8)*cell,x=width-size-86,y=Math.floor((height-size)/2);
  ProjectLink.drawQR(g,x,y,cell);
  return canvas;
}
