(() => {
  const $=id=>document.getElementById(id),tracks=window.PIANO_TRACKS,audio=$('audio');
  const stage=new FireworkStage($('scene')),time=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');
  const art={
    tracks:'<path d="M3 6h16M3 12h9M3 18h5m10-8v9m0-9 4-1"/><ellipse cx="16" cy="19" rx="2" ry="1.5"/>',
    tune:'<path d="M3 6h5m4 0h9M3 12h11m4 0h3M3 18h3m4 0h11"/><circle cx="10" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
    share:'<path d="M12 15V3m-4 4 4-4 4 4M6 10H4v11h16V10h-2"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
    previous:'<path d="M5 5v14m14-13L8 12l11 6z" fill="currentColor"/>',
    next:'<path d="M19 5v14M5 6l11 6-11 6z" fill="currentColor"/>',
    play:'<path d="M7 4.7q0-1 1-.45l12 7.1q1 .65 0 1.3l-12 7.1q-1 .55-1-.45z" fill="currentColor" stroke="none"/>',
    pause:'<path d="M8 5v14m8-14v14" stroke-width="4"/>',
    sound:'<path d="M3 9h4l5-4v14l-5-4H3zM16 8q4 4 0 8m2-11q7 7 0 14"/>',
    muted:'<path d="M3 9h4l5-4v14l-5-4H3zM16 9l5 6m0-6l-5 6"/>',
    full:'<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
    small:'<path d="M4 9h5V4m6 0v5h5m0 6h-5v5m-6 0v-5H4"/>',
    book:'<path d="M3 5q5-2 9 1 4-3 9-1v13q-5-2-9 1-4-3-9-1zM12 6v13"/>',
    camera:'<rect x="2" y="6" width="13" height="12" rx="2"/><path d="m15 10 6-3v10l-6-3"/>',
    down:'<path d="m6 9 6 6 6-6"/>', close:'<path d="m6 6 12 12m0-12L6 18"/>'
  };
  function icon(name){return '<svg aria-hidden="true" viewBox="0 0 24 24">'+art[name]+'</svg>'}
  for(const i of document.querySelectorAll('[data-icon]'))i.innerHTML=icon(i.dataset.icon);
  const brand=$('brandMark').getContext('2d');
  brand.translate(44,44);brand.strokeStyle='#f0c68d';brand.lineCap='round';
  for(let i=0;i<20;i++){
    const a=i*Math.PI/10,inner=i%2?10:6,outer=i%2?25:35;
    brand.lineWidth=i%2?1.8:2.7;brand.beginPath();brand.moveTo(inner*Math.cos(a),inner*Math.sin(a));brand.lineTo(outer*Math.cos(a),outer*Math.sin(a));brand.stroke();
  }
  function cover(canvas,index){
    const color=[['#522f26','#eca675'],['#423048','#e6aac8'],['#153d42','#94d5c6'],['#29364f','#b9c9f0'],
      ['#593740','#f5c4ac'],['#293955','#c7d4ff'],['#364334','#c8dc97']][index%7];
    const g=canvas.getContext('2d'),w=canvas.width=112,h=canvas.height=124,rand=Fireworks.random(555+index);
    const bg=g.createLinearGradient(0,0,w,h);bg.addColorStop(0,color[0]);bg.addColorStop(1,'#121821');g.fillStyle=bg;g.fillRect(0,0,w,h);
    g.strokeStyle=color[1];g.fillStyle=color[1];g.lineWidth=1;
    for(let j=0;j<54;j++){
      g.beginPath();
      if(index%4===0){
        const a=j*Math.PI*2/54,r=12+rand()*18;g.moveTo(55+Math.cos(a)*r,55+Math.sin(a)*r);
        g.lineTo(55+Math.cos(a)*(35+rand()*18),55+Math.sin(a)*(35+rand()*18));
      }else if(index%4===1){
        g.ellipse(59,63,10+j*.63,6+j*.33,j*.049,0,Math.PI*1.54);
      }else if(index%4===2){
        g.moveTo(j*3-30,122);g.bezierCurveTo(102-j*.7,85,20+j*.45,54,31+j*1.8,1);
      }else{
        g.arc(54,58,(j%5)*9+4,Math.floor(j/5)*.61,Math.floor(j/5)*.61+.35);
      }
      g.globalAlpha=.37+rand()*.42;g.stroke();
    }
    for(let j=0;j<55;j++){g.globalAlpha=rand()*.48;g.fillRect(rand()*w,rand()*h,1,1)}
    g.globalAlpha=1;
  }
  let index=0,poster=true,frame=0,revision=0,keyState=null,drawnKeys='',lastUI=-1;
  const prefKey='piano-fireworks.player.v1.';
  function preference(key){
    try{return localStorage.getItem(prefKey+key)}catch{return null}
  }
  function remember(key,value){
    try{localStorage.setItem(prefKey+key,value)}catch{}
  }
  let opening=0,restoringSound=false,muted=preference('muted')==='true';
  function scoreTime(){return (audio.currentTime||0)-opening}
  function syncSound(){audio.muted=muted||opening>0||restoringSound}
  function leaveOpening(t){
    opening=0;
    restoringSound=true;syncSound();
    audio.currentTime=t;
    if(!audio.seeking){restoringSound=false;syncSound()}
  }
  function advanceOpening(){
    if(opening>0 && scoreTime()>=0)leaveOpening(0);
  }
  function buttonIcon(el,shape,label){
    if(el.dataset.shape!==shape){el.innerHTML=icon(shape);el.dataset.shape=shape}
    if(el.closest('.panelTools')&&!el.querySelector('span'))el.append(document.createElement('span'));
    if(el.closest('.panelTools'))el.querySelector('span').textContent=label;
    el.setAttribute('aria-label',label);el.title=label;
  }
  const queuePanel=$('queuePanel'),queueToggle=$('queueToggle');
  function closeQueue(restoreFocus=false){
    if(queuePanel.hidden)return;
    queuePanel.hidden=true;queueToggle.setAttribute('aria-expanded','false');
    if(restoreFocus)queueToggle.focus({preventScroll:true});
    showControls();
  }
  function playFromList(i){
    if(index!==i)select(i);
    closeQueue(true);
    if(drawer.open)drawer.close();
    play();
  }
  const queueRows=tracks.map((track,i)=>{
    const item=document.createElement('li'),button=document.createElement('button');
    const name=document.createElement('span'),duration=document.createElement('time');
    name.textContent=track.title;duration.textContent=time(track.duration);
    button.type='button';button.title=track.composer+' · '+track.title;
    button.append(name,duration);button.onclick=()=>playFromList(i);
    item.append(button);$('queueRows').append(item);
    return button;
  });
  queueToggle.onclick=()=>{
    if(!queuePanel.hidden){closeQueue(true);return}
    queuePanel.hidden=false;queueToggle.setAttribute('aria-expanded','true');showControls();
    queueRows[index].focus({preventScroll:true});queueRows[index].scrollIntoView({block:'nearest'});
  };
  document.addEventListener('pointerdown',e=>{
    if(!queuePanel.contains(e.target) && !queueToggle.contains(e.target))closeQueue();
  });
  document.addEventListener('focusin',e=>{
    if(!queuePanel.contains(e.target) && e.target!==queueToggle)closeQueue();
  });
  const recordings=$('artistRecordings'),recordingPlayer=$('recordingPlayer');
  function closeRecording(){
    recordingPlayer.replaceChildren();
    recordings.querySelector('[aria-current]')?.removeAttribute('aria-current');
  }
  for(const link of recordings.querySelectorAll('a')){
    link.onclick=e=>{
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      e.preventDefault();
      ++revision;audio.pause();closeRecording();
      const url=new URL(link.href);url.hostname='embed.music.apple.com';
      const embed=document.createElement('iframe');
      embed.src=url.href;embed.title=link.textContent+' · Apple Music 试听';
      embed.allow='autoplay; encrypted-media';embed.height='175';
      const external=document.createElement('a');
      external.href=link.href;external.target='_blank';external.rel='noopener';
      external.textContent='在 Apple Music 打开 ↗';
      recordingPlayer.append(embed,external);link.setAttribute('aria-current','true');
    };
  }
  recordings.addEventListener('toggle',()=>{if(!recordings.open)closeRecording()});
  function trackCredit(track){
    return track.instrument && track.instrument!=='钢琴'
      ? track.composer+' · '+track.instrument : track.composer;
  }
  const buttons=tracks.map((track,i)=>{
    const button=document.createElement('button');button.className='track';button.type='button';
    const art=document.createElement('canvas');art.setAttribute('aria-hidden','true');cover(art,i);
    const text=document.createElement('span'),label=document.createElement('strong'),author=document.createElement('small');
    label.textContent=track.title;author.textContent=trackCredit(track);text.append(label,author);
    const len=document.createElement('span');len.className='len';len.textContent=time(track.duration);
    button.append(art,text,len);button.onclick=()=>playFromList(i);
    $('tracks').append(button);
    if(track.source){
      const a=document.createElement('a');a.href=track.source;a.textContent=track.title+' ↗';a.target='_blank';a.rel='noopener noreferrer';$('sourceLinks').append(a);
    }
    return button;
  });
  $('count').textContent=tracks.length+' 首';
  function select(i){
    ++revision;audio.pause();opening=0;restoringSound=false;syncSound();index=(i+tracks.length)%tracks.length;
    const tr=tracks[index];remember('track',tr.id);stage.select(tr,config);
    loopRange=null;updateLoopLabel();showCoverage();
    poster=true;audio.src=tr.src;audio.load();$('error').textContent='';
    $('song').textContent=tr.title;$('artist').textContent=trackCredit(tr);
    const drums=Boolean(tr.notes[0]?.[3]);
    $('keys').hidden=drums;
    const label=drums?'实时鼓点':'实时音高';
    $('performanceLabel').textContent=label;
    $('keys').closest('section').setAttribute('aria-label',label);
    $('tempo').textContent=tr.tempo+' BPM';$('duration').textContent=time(tr.duration);
    $('seek').max=tr.duration;
    buttons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===index)));
    queueRows.forEach((b,n)=>b.setAttribute('aria-current',n===index?'true':'false'));
    $('queuePosition').textContent=(index+1)+' / '+tracks.length;
    lastUI=-1;drawnKeys='';refresh();request();
    if(drawer.open && !$('sharePanel').hidden)updateShare();
  }
  async function play(){
    closeRecording();
    const token=++revision;
    const fresh=poster||audio.ended;
    if(audio.ended)audio.currentTime=0;
    if(fresh && config.launch && !loopRange && !opening && audio.currentTime===0){
      opening=Math.max(0,-stage.script.firstLaunch-config.offset/1000);
      syncSound();
    }
    try{await audio.play();if(token!==revision)return;poster=false;$('error').textContent='';refresh();request()}
    catch(e){if(token===revision && e.name!=='AbortError')$('error').textContent='无法播放音轨，请检查 music 文件夹中的音频文件。'}
  }
  function toggle(){if(audio.paused)play();else{++revision;audio.pause()}}
  function refresh(){
    const active=!audio.paused&&!audio.ended;
    document.body.classList.toggle('playing',active);
    const status=opening?'升空 · '+Math.ceil(Math.max(0,-scoreTime()))+' 秒':audio.ended?'演出结束':'';
    $('showState').textContent=status;
    $('showState').closest('.viewbar').hidden=!status;
    buttonIcon($('play'),active?'pause':'play',active?'暂停':audio.ended?'重播':'播放');
    buttonIcon($('mute'),muted?'muted':'sound',muted?'恢复声音':'静音');
    const value=Math.max(0,scoreTime());
    const bpm=Math.round(Choreography.tempoSegment(tracks[index],1,value)[2])+' BPM';
    if($('tempo').textContent!==bpm)$('tempo').textContent=bpm;
    updateSection(value);
    $('seek').value=value;$('seek').style.setProperty('--played',Math.min(100,100*value/tracks[index].duration)+'%');
    $('elapsed').textContent=time(value);$('seek').setAttribute('aria-valuetext',time(value));
  }
  function keyboard(t){
    const notes=tracks[index].notes,active=new Set();
    let low=0,high=notes.length;
    while(low<high){const mid=(low+high)>>1;if(notes[mid][0]<t-.16)low=mid+1;else high=mid}
    if($('keys').hidden){
      let stroke;
      for(let j=low;!poster && j<notes.length && notes[j][0]<=t;j++)stroke=notes[j][3];
      $('noteName').textContent=({accent:'重音',tap:'单击',ghost:'轻击',roll:'滚奏'})[stroke]||'—';
      return;
    }
    if(!poster)for(let j=low;j<notes.length && notes[j][0]<=t;j++)active.add(notes[j][1]);
    const signature=[...active].join(',');
    if(signature===drawnKeys && keyState)return;
    drawnKeys=signature;keyState=true;
    const canvas=$('keys'),g=canvas.getContext('2d');
    const width=canvas.width=Math.max(200,Math.round(canvas.clientWidth*2)),height=canvas.height=80;
    const blacks=[1,3,6,8,10],white=[],black=[];
    for(let n=21;n<=108;n++)if(blacks.includes(n%12))black.push([n,white.length]);else white.push(n);
    const step=width/white.length;
    for(let j=0;j<white.length;j++){g.fillStyle=active.has(white[j])?'#f1bb7c':'#b9bfca';g.fillRect(j*step,0,Math.max(1,step-1),height)}
    for(const [n,j] of black){g.fillStyle=active.has(n)?'#d3a267':'#222b3a';g.fillRect((j-.32)*step,0,step*.64,height*.61)}
    const n=Math.max(...active);$('noteName').textContent=Number.isFinite(n)?['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][n%12]+(Math.floor(n/12)-1):'—';
  }
  let frameInterval=1000/60,lastFrame=null,drawCost=0,clockRunning=false;
  function resetFrameClock(){lastFrame=null;drawCost=0;frameInterval=1000/60}
  audio.addEventListener('playing',()=>{clockRunning=true;resetFrameClock();request()});
  for(const event of ['waiting','pause','ended','emptied']){
    audio.addEventListener(event,()=>{clockRunning=false;resetFrameClock()});
  }
  audio.addEventListener('seeking',resetFrameClock);
  document.addEventListener('visibilitychange',resetFrameClock);
  function draw(now){
    frame=0;if(document.hidden)return;
    advanceOpening();enforceLoop();
    const running=clockRunning&&!audio.paused&&!audio.ended&&!audio.seeking&&audio.readyState>=3;
    const start=performance.now();
    if(running&&lastFrame!==null){
      const interval=now-lastFrame;
      if(interval>=4&&interval<=50)frameInterval+=(interval-frameInterval)*.25;
    }
    lastFrame=running?now:null;
    // Sample the middle of the frame's display interval. The media clock keeps
    // advancing while Canvas draws; keep the estimate bounded on slow devices.
    const lead=running?Math.min(32,frameInterval*.5+Math.min(drawCost,frameInterval)):0;
    let t=scoreTime()+lead*.001*audio.playbackRate;
    if(opening)t=Math.min(0,t);
    else if(loopRange&&running)t=Math.min(t,loopRange.end);
    stage.render(t,poster);
    if($('mobilePanel').open&&!document.querySelector('.keysPane').hidden)keyboard(t);
    if(running)drawCost+=(Math.min(32,performance.now()-start)-drawCost)*.25;
    if(now-lastUI>80||lastUI<0){refresh();lastUI=now}
    if(!audio.paused&&!audio.ended)request();
  }
  function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
  $('play').onclick=toggle;
  $('scene').onclick=()=>{
    if(isFull())exitShow();
    else if(!wakeOnlyTap)toggle();
    wakeOnlyTap=false;
  };
  $('previous').onclick=()=>{select(index-1);play()};$('next').onclick=()=>{select(index+1);play()};
  $('mute').onclick=()=>{muted=!muted;remember('muted',String(muted));syncSound();refresh()};
  function updateSection(time){
    const parts=stage.script.parts;
    const number=Choreography.sectionAt(parts,time-config.offset/1000);
    const title=Choreography.names[parts[number].form];
    const label=parts.length===1?title:`第 ${number+1}/${parts.length} 段 · ${title}`;
    if($('sectionName').textContent!==label){
      $('sectionName').textContent=label;
      $('sectionHint').textContent=Choreography.descriptions[parts[number].form];
    }
    $('nextSection').hidden=number+1>=parts.length;
  }
  function audition(t){
    if(!Number.isFinite(audio.duration))return;
    poster=false;
    const target=Math.max(0,Math.min(t,audio.duration));
    if(opening)leaveOpening(target);else audio.currentTime=target;
    if(loopRange)setLoopAt(audio.currentTime);
    refresh();lastUI=-1;request();
    if(audio.paused)play();
  }
  $('nextSection').onclick=()=>{
    const parts=stage.script.parts,offset=config.offset/1000;
    const next=parts[Choreography.sectionAt(parts,scoreTime()-offset)+1];
    if(next)audition(next.start+offset+.003);
  };
  function auditionFormation(t,lead){
    audition(t+config.offset/1000-(config.launch?lead+.20:1.3));
  }
  $('previewEnding').onclick=()=>{
    if(stage.script.peak!=null)auditionFormation(stage.script.peak,stage.script.endingLead);
  };
  function showSalvos(){
    const buttons=stage.script.salvos.map(({t,form,lead})=>{
      const button=document.createElement('button');
      button.type='button';
      const label=time(t+config.offset/1000)+' '+Choreography.salvoNames[form];
      button.textContent=label+' ›';
      button.setAttribute('aria-label','试听 '+label);
      button.onclick=()=>auditionFormation(t,lead);
      return button;
    });
    $('salvoCues').replaceChildren(...buttons);
  }
  function showCoverage(){
    const notes=tracks[index].notes;
    const unit=notes[0]?.[3]?' 鼓击':' 音符';
    $('coverage').textContent=notes.length.toLocaleString()+unit+' · '+stage.script.count.toLocaleString()+' 次触发';
    const place=Landscapes.resolve('score',tracks[index]);
    $('backdrop').options[0].textContent='随曲目 · '+Landscapes.scenes[place].name;
    const environment=Landscapes.scenes[Landscapes.resolve(config.backdrop,tracks[index])];
    $('scene').setAttribute('aria-label',environment.name+'中随演奏音符绽放的烟花');
    const {peak,ending,minLead,maxLead,minHeight,maxHeight}=stage.script;
    $('heightHint').textContent='爆点 '+Math.round(minHeight)+'–'+Math.round(maxHeight)+' 米 · 升空 '+minLead.toFixed(1)+'–'+maxLead.toFixed(1)+' 秒';
    showSalvos();
    $('endingOptions').hidden=$('endingNoteLabel').hidden=$('endingDetail').hidden=peak==null;
    const info=Choreography.endings[ending];
    $('endingDetail').textContent=info.name+' · '+info.detail;
    if(peak!=null)$('previewEnding').textContent='试听'+info.name+' · '+time(peak+config.offset/1000)+' ›';
    updateSection(Math.max(0,scoreTime()));
  }
  let config=setupTuning({configure(next){
    const rebuild=config.look!==next.look || config.shotTime!==next.shotTime || config.salvos!==next.salvos || config.height!==next.height || config.overlap!==next.overlap || config.trigger!==next.trigger || config.palette!==next.palette ||
      config.staging!==next.staging || config.ending!==next.ending || config.finale!==next.finale || config.shapes.join()!==next.shapes.join();
    config=next;
    if(opening && !next.launch)leaveOpening(0);
    if(rebuild)stage.select(tracks[index],next);
    else {stage.config=next;stage.motion=next.camera}
    showCoverage();request();
  }});
  let loopRange=null;
  function setLoopAt(t){
    const duration=tracks[index].duration;
    const start=Math.max(0,Math.min(t,duration-6));
    loopRange={start,end:Math.min(duration,start+6)};
    updateLoopLabel();
  }
  function updateLoopLabel(){
    $('loop').setAttribute('aria-pressed',Boolean(loopRange));
    $('loop').textContent=loopRange?'结束循环 · '+time(loopRange.start)+' – '+time(loopRange.end):'循环试听 6 秒';
  }
  function enforceLoop(){
    if(!opening && loopRange && !audio.seeking && !audio.paused && audio.currentTime>=loopRange.end){
      audio.currentTime=loopRange.start;
    }
  }
  $('loop').onclick=()=>{
    if(loopRange){loopRange=null;updateLoopLabel();return}
    if(opening)leaveOpening(0);
    setLoopAt(audio.currentTime);
    if(audio.currentTime>=loopRange.end)audio.currentTime=loopRange.start;
    if(audio.paused)play();
  };
  audio.addEventListener('timeupdate',()=>{advanceOpening();enforceLoop()});
  audio.addEventListener('seeked',()=>{if(restoringSound&&!audio.seeking){restoringSound=false;syncSound()}});
  audio.addEventListener('ended',()=>{
    if(loopRange){audio.currentTime=loopRange.start;play()}
    else if(index+1<tracks.length){select(index+1);play()}
  });
  $('seek').oninput=e=>{
    const t=Number(e.target.value);poster=false;
    if(Number.isFinite(audio.duration)){if(opening)leaveOpening(t);else audio.currentTime=Math.min(t,audio.duration);if(loopRange)setLoopAt(t)}
    lastUI=-1;request();
  };
  for(const evt of ['loadedmetadata','play','pause','seeked','ended','volumechange','canplay']){
    audio.addEventListener(evt,()=>{if(evt==='play')poster=false;lastUI=-1;refresh();request()});
  }
  audio.addEventListener('error',()=>{$('error').textContent='音频加载失败，请检查本地音轨文件。'});
  const drawer=$('mobilePanel');
  const share=setupConcertShare();
  function updateShare(){
    share.show(tracks[index],config,scoreTime(),poster || audio.ended || opening>0);
  }
  const panels={railTracks:'program',railTuning:'tuning',railShare:'sharePanel'};
  let opener=null;
  for(const [id,section] of Object.entries(panels)){
    $(id).setAttribute('aria-controls','mobilePanel');
    $(id).setAttribute('aria-expanded','false');
    $(id).onclick=()=>{
      if(drawer.open && opener===$(id)){drawer.close();return}
      if(opener)opener.setAttribute('aria-expanded','false');
      opener=$(id);opener.setAttribute('aria-expanded','true');
      const tracksVisible=section==='program';
      if(!tracksVisible)closeRecording();
      $('program').hidden=!tracksVisible;
      $('tuning').hidden=section!=='tuning';
      const sharing=section==='sharePanel';
      $('sharePanel').hidden=!sharing;
      document.querySelector('.keysPane').hidden=section!=='tuning';
      $('creditsButton').hidden=!tracksVisible;
      $('count').hidden=!tracksVisible;
      $('panelTitle').textContent=opener.textContent.trim();
      if(!drawer.open)drawer.show();
      showControls();
      if(sharing)updateShare();
      keyState=null;request();
      drawer.scrollTop=0;
      $('closePanel').focus({preventScroll:true});
    };
  }
  $('closePanel').onclick=()=>drawer.close();
  drawer.addEventListener('close',()=>{if(!drawer.open)closeRecording()});
  drawer.addEventListener('close',()=>{if(!drawer.open && opener){opener.setAttribute('aria-expanded','false');opener.focus({preventScroll:true});opener=null}});
  if(window.TuningPreview?.trial && matchMedia('(min-width:701px)').matches){
    opener=$('railTuning');
    opener.setAttribute('aria-expanded','true');
    drawer.open=true;
  }
  // An idle stage keeps its dimensions. Only its controls fade.
  let idleTimer, pointerHeld=false, keyboardNavigation=false, wakeOnlyTap=false;
  function showControls(){
    clearTimeout(idleTimer);
    document.body.classList.remove('controlsIdle');
    if(audio.paused || audio.ended || pointerHeld || !queuePanel.hidden || drawer.open || $('credits').open || document.hidden)return;
    if(keyboardNavigation && document.activeElement?.closest('.deck,.hallRail,.mast'))return;
    idleTimer=setTimeout(()=>document.body.classList.add('controlsIdle'),3000);
  }
  document.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    keyboardNavigation=false;
    showControls();
  },{passive:true});
  document.addEventListener('pointerdown',e=>{
    wakeOnlyTap=e.pointerType!=='mouse' && e.target===$('scene') && document.body.classList.contains('controlsIdle');
    pointerHeld=true;keyboardNavigation=false;showControls();
  },{passive:true});
  function releasePointer(){pointerHeld=false;showControls()}
  for(const type of ['pointerup','pointercancel','blur'])window.addEventListener(type,releasePointer);
  document.addEventListener('keydown',()=>{keyboardNavigation=true;wakeOnlyTap=false;showControls()},true);
  document.addEventListener('focusin',showControls);
  drawer.addEventListener('close',showControls);
  $('credits').addEventListener('close',showControls);
  for(const type of ['play','pause','ended','error'])audio.addEventListener(type,showControls);
  document.addEventListener('visibilitychange',showControls);
  function isFull(){return Boolean(document.fullscreenElement)||$('concert').classList.contains('theater')}
  async function exitShow(){
    if(document.fullscreenElement)await document.exitFullscreen();
    $('concert').classList.remove('theater');screenState();
  }
  function screenState(){
    buttonIcon($('expand'),isFull()?'small':'full',isFull()?'退出全屏':'全屏');
    $('scene').title=isFull()?'点击退出全屏，空格暂停或继续':'点击播放或暂停';
  }
  $('expand').onclick=async()=>{
    if(isFull()){await exitShow();return}
    if(drawer.open)drawer.close();
    if(audio.paused)play();
    try{await $('concert').requestFullscreen()}catch{$('concert').classList.add('theater')}
    screenState();
  };
  document.addEventListener('fullscreenchange',screenState);

  let exporting=null,downloadURL='';
  $('exportVideo').onclick=async()=>{
    if(exporting){exporting.abort();return}
    const controller=new AbortController(),track=tracks[index];
    exporting=controller;
    const button=$('exportVideo'),status=$('exportStatus'),link=$('downloadVideo');
    link.hidden=true;link.removeAttribute('href');
    if(downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=''}
    button.querySelector('span').textContent='取消导出';status.textContent='准备导出《'+track.title+'》…';
    try{
      const blob=await exportConcert(track,Fireworks.normalize(config),controller.signal,pct=>{
        status.textContent='《'+track.title+'》 · '+pct+'%';
      });
      downloadURL=URL.createObjectURL(blob);
      link.href=downloadURL;link.download=track.title+' · 花火琴房.mp4';link.hidden=false;
      status.textContent='已导出《'+track.title+'》';link.click();
    }catch(err){
      status.textContent=controller.signal.aborted?'已取消导出':'导出失败。'+err.message;
    }finally{button.querySelector('span').textContent='导出 MP4';exporting=null}
  };
  $('creditsButton').onclick=()=>$('credits').showModal();
  $('closeCredits').onclick=()=>$('credits').close();
  document.addEventListener('keydown',e=>{
    if(!queuePanel.hidden && e.key==='Escape'){e.preventDefault();closeQueue(true);return}
    if($('credits').open)return;
    if(drawer.open&&e.key==='Escape'){drawer.close();return}
    if(drawer.open && drawer.contains(e.target))return;
    if(e.key==='Escape'){$('concert').classList.remove('theater');screenState()}
    if(e.code==='Space' && (isFull()||!e.target.closest('input,button,select,a'))){e.preventDefault();toggle()}
  });
  const deck=document.querySelector('.deck');
  const layoutObserver=new ResizeObserver(entries=>{
    if(entries.some(entry=>entry.target===$('scene'))){stage.resize();keyState=null;request()}
    deck.style.setProperty('--queue-room',Math.max(50,$('scene').clientHeight-deck.offsetHeight-26)+'px');
  });
  layoutObserver.observe(deck);layoutObserver.observe($('scene'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else request()});
  const savedId=preference('track');
  const savedTrack=tracks.findIndex(track=>track.id===savedId);
  screenState();select(savedTrack>=0?savedTrack:Math.max(0,tracks.findIndex(track=>track.id==='prayer')));
})();
