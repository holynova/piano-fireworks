function setupTuning(app) {
  const $=id=>document.getElementById(id);
  const liveKey='piano-fireworks.tuning.v1';
  const preview=window.TuningPreview;
  const storageKey=preview?.trial ? liveKey+'.preview' : liveKey;
  const initial=Fireworks.normalize();
  for(const [id,scene] of Object.entries(Landscapes.scenes))$('backdrop').add(new Option(scene.name,id));
  let stored;
  try { stored=JSON.parse(localStorage.getItem(storageKey) ?? (preview && localStorage.getItem(liveKey))) } catch {}
  // The reference preset predates themes. Preserve its off-screen controls on
  // the installation where it was created, even after later edits to slot A.
  const extrasKey=liveKey+'.referenceExtras';
  try {
    const reference=JSON.parse(localStorage.getItem(liveKey))?.A;
    let extras=JSON.parse(localStorage.getItem(extrasKey));
    const visible=['trigger','camera','view','backdrop','brightness','overlap','staging','windSpeed','windDirection','shotTime'];
    if(!extras && reference && !reference.theme && reference.palette==='all' && visible.every(key=>reference[key]===initial[key]) &&
        ['shapes','tourViews'].every(key=>Array.isArray(reference[key]) && reference[key].length===initial[key].length && initial[key].every(v=>reference[key].includes(v)))){
      extras={};
      for(const key of ['offset','height','decay','attack','salvos','finale','launch','ending'])extras[key]=reference[key];
      localStorage.setItem(extrasKey,JSON.stringify(extras));
    }
    if(extras)Object.assign(initial,Fireworks.normalize({...initial,...extras}));
  } catch {}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){initial.camera='fixed';initial.view='mid'}
  let slot=stored?.slot==='B'?'B':'A';
  function loadSlot(id,base){
    const old=stored?.[id];
    return Fireworks.normalize({...base,...old,view:old?.view??(old?'mid':base.view),ending:old?.ending??(old?'ring':base.ending)});
  }
  const slots={
    A:loadSlot('A',initial),
    B:loadSlot('B',{...initial,trigger:'chord',shapes:['peony']})
  };
  const saveStatus=document.createElement('small');
  saveStatus.setAttribute('role','status');
  saveStatus.hidden=true;
  function saveChange(patch){
    try{
      // Merge only the edited values, so an older tab keeps newer edits in either slot.
      const raw=localStorage.getItem(storageKey);
      let latest;
      try{latest=JSON.parse(raw)}catch{}
      for(const id of ['A','B']){
        slots[id]=Fireworks.normalize({...slots[id],...latest?.[id],...(id===slot?patch:null)});
      }
      localStorage.setItem(storageKey,JSON.stringify({...slots,slot}));
      saveStatus.hidden=true;
    }catch{
      slots[slot]=Fireworks.normalize({...slots[slot],...patch});
      saveStatus.hidden=false;
      saveStatus.textContent='浏览器无法保存设置，本次调校仅在当前页面生效。';
    }
  }
  const shapeButtons=Object.entries(Fireworks.kinds).map(([kind,title])=>{
    const b=document.createElement('button');b.type='button';
    const image=new Image(240,164);
    image.alt='';image.loading='lazy';image.decoding='async';
    image.src='assets/shapes/'+kind+'.webp';
    const caption=document.createElement('span');caption.textContent=title;
    b.append(image,caption);
    b.onclick=()=>{
      const shapes=slots[slot].shapes;
      update('shapes',shapes.includes(kind)?shapes.filter(s=>s!==kind):[...shapes,kind]);
    };
    $('shapes').append(b);return [b,kind];
  });
  const tourBoxes=[...$('view').options].filter(o=>o.value!=='auto').map(o=>{
    const label=document.createElement('label'),box=document.createElement('input');
    box.type='checkbox';box.value=o.value;
    label.append(box,o.textContent.split(' · ')[0]);$('tourViews').append(label);
    box.onchange=()=>update('tourViews',tourBoxes.filter(b=>b.checked).map(b=>b.value));
    return box;
  });
  const previewUI=preview?.mount();
  $('tuning').append(saveStatus);
  function display(){
    const cfg=slots[slot];
    $('tourOptions').hidden=cfg.view!=='auto';
    for(const box of tourBoxes){
      box.checked=cfg.tourViews.includes(box.value);box.disabled=box.checked&&cfg.tourViews.length===2;
    }
    $('shotTimeValue').textContent=cfg.shotTime+' 秒';
    $('windSpeedValue').textContent=cfg.windSpeed===0?'无风':cfg.windSpeed+' m/s';
    for(const key of ['trigger','staging','salvos','ending','palette','brightness','overlap','height','attack','decay','offset','camera','view','backdrop','shotTime','windSpeed','windDirection'])$(key).value=cfg[key];
    for(const key of ['launch','finale'])$(key).checked=cfg[key];
    for(const id of ['A','B'])$('slot'+id).setAttribute('aria-pressed',slot===id);
    for(const [b,kind] of shapeButtons){
      const checked=cfg.shapes.includes(kind);
      b.setAttribute('aria-pressed',checked);b.disabled=checked&&cfg.shapes.length===1;
    }
    $('shapeSummary').textContent=cfg.shapes.length>2?cfg.shapes.length+' 种':cfg.shapes.map(s=>Fireworks.kinds[s]).join(' · ');
    $('brightnessValue').textContent=cfg.brightness+'%';
    $('overlapValue').textContent=cfg.overlap+'%';
    $('heightValue').textContent=cfg.height+'%';
    $('attackValue').textContent=cfg.attack+'%';
    $('decayValue').textContent=cfg.decay+' 秒';
    $('offsetValue').textContent=cfg.offset===0?'0 ms':(cfg.offset<0?'提前 ':'延后 ')+Math.abs(cfg.offset)+' ms';
    for(const key of ['brightness','overlap','height','attack','decay','offset'])$(key).setAttribute('aria-valuetext',$(key+'Value').textContent);
    previewUI?.sync(slots,slot);
  }
  function commit(patch={}){
    saveChange(patch);display();app.configure(slots[slot]);
  }
  function update(key,value){
    commit({[key]:value});
  }
  for(const key of ['trigger','staging','salvos','ending','palette','camera','view','backdrop'])$(key).onchange=e=>update(key,e.target.value);
  $('windDirection').onchange=e=>update('windDirection',Number(e.target.value));
  for(const key of ['brightness','overlap','height','attack','decay','offset','shotTime','windSpeed'])$(key).oninput=e=>update(key,Number(e.target.value));
  for(const key of ['launch','finale'])$(key).onchange=e=>update(key,e.target.checked);
  for(const id of ['A','B'])$('slot'+id).onclick=()=>{slot=id;commit()};
  $('resetMix').onclick=()=>commit(initial);
  display();
  return slots[slot];
}
