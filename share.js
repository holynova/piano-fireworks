function setupConcertShare(){
  const $=id=>document.getElementById(id);
  const text=$('shareText'),preview=$('sharePreview'),download=$('saveShareCard'),native=$('sendShareCard');
  let revision=0,imageURL='',file=null,trackId='';
  const record=name=>window.umami?.track?.(name,{scope:'site',track_id:trackId});
  $('copyShareText').onclick=async()=>{
    const message=text.value;
    let copied=false;
    try{await navigator.clipboard.writeText(message);copied=true}catch{
      text.focus();text.select();
      try{copied=document.execCommand('copy')}catch{}
    }
    $('copyStatus').textContent=copied?'已复制':'文字已选中，可用系统菜单复制。';
    if(copied)record('share_link_copy');
  };
  download.onclick=()=>{record('share_card_download');$('cardStatus').textContent='已开始下载 PNG。'};
  native.onclick=async()=>{
    if(!file)return;
    try{
      await navigator.share({files:[file],title:'花火琴房',text:text.value});
      record('share_card_native');$('cardStatus').textContent='已分享。';
    }catch(error){
      $('cardStatus').textContent=error.name==='AbortError'?'已取消分享。':'可下载 PNG 或复制上方文字分享。';
    }
  };
  async function show(track,config,time,poster){
    const token=++revision;
    trackId=track.id;
    const instrument=track.instrument||'钢琴';
    text.value='在花火琴房听《'+track.title+'》（'+instrument+'）。每一朵烟花，都随乐声绽放。\n'+ProjectLink.url;
    $('copyStatus').textContent='';$('cardStatus').textContent='正在生成卡片…';
    preview.hidden=download.hidden=native.hidden=true;
    download.removeAttribute('href');preview.removeAttribute('src');file=null;
    if(imageURL){
      const previous=imageURL;setTimeout(()=>URL.revokeObjectURL(previous),60000);imageURL='';
    }
    record('share_card_open');
    try{
      await document.fonts.ready;
      if(token!==revision)return;
      const canvas=concertShareCard(track,config,time,poster);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(token!==revision)return;
      if(!blob)throw new Error('PNG encoding failed');
      imageURL=URL.createObjectURL(blob);
      const name=track.title+' · 花火琴房.png';
      preview.src=download.href=imageURL;download.download=name;
      preview.alt='《'+track.title+'》烟花演出，扫码打开花火琴房';
      preview.hidden=download.hidden=false;
      $('cardStatus').textContent='';
      if(typeof File==='function' && navigator.share && navigator.canShare){
        file=new File([blob],name,{type:'image/png'});
        try{native.hidden=!navigator.canShare({files:[file]})}catch{native.hidden=true}
      }
    }catch{
      if(token===revision)$('cardStatus').textContent='卡片生成失败。可复制上方文字，或重新打开分享再试。';
    }
  }
  return {show};
}

function concertShareCard(track,config,time,poster){
  const canvas=document.createElement('canvas'),width=1080;
  canvas.width=width;canvas.height=1300;
  const g=canvas.getContext('2d');
  const serif='"Songti SC","STSong","Noto Serif CJK SC",serif';
  // Re-render the chosen score moment at card resolution, independent of the sidebar width.
  const art=document.createElement('canvas'),stage=new FireworkStage(art,{width,height:680});
  stage.select(track,config);stage.render(time,poster);
  g.fillStyle='#10151e';g.fillRect(0,0,width,canvas.height);
  g.drawImage(document.getElementById('brandMark'),52,24,64,64);
  g.fillStyle='#edcea1';g.font='500 34px '+serif;g.fillText('花火琴房',132,68);
  g.drawImage(art,0,112);
  g.fillStyle='#edc68f';g.fillRect(60,837,48,3);
  g.fillStyle='#f4efe5';g.font='600 64px '+serif;
  g.fillText(track.title,58,932,width-116);
  g.fillStyle='#bdc2ca';g.font='30px system-ui';
  g.fillText(track.composer+'  ·  '+(track.instrument||'钢琴'),60,997,width-120);
  g.fillStyle='#eee5d6';g.fillRect(0,1050,width,250);
  g.fillStyle='#282722';g.font='500 39px '+serif;
  g.fillText('扫码打开音乐烟花观演厅',60,1156);
  g.fillStyle='#514d46';g.font='30px system-ui';g.fillText(ProjectLink.url,60,1217,720);
  const cell=5,size=(ProjectLink.modules.length+8)*cell;
  ProjectLink.drawQR(g,width-60-size,1050+Math.floor((250-size)/2),cell);
  return canvas;
}
