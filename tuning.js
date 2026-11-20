function setupTuning(app) {
  const $=id=>document.getElementById(id);
  const liveKey='piano-fireworks.tuning.v1';
  const preview=window.TuningPreview;
  const storageKey=preview?.trial ? liveKey+'.preview' : liveKey;
  const initial=Fireworks.normalize();
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){initial.camera='fixed';initial.view='mid'}
  for(const [id,scene] of Object.entries(Landscapes.scenes))$('backdrop').add(new Option(scene.name,id));
  let stored;
  try { stored=JSON.parse(localStorage.getItem(storageKey) ?? (preview && localStorage.getItem(liveKey))) } catch {}
  let slot=stored?.slot==='B'?'B':'A';
  function loadSlot(id,base){
    const old=stored?.[id];
    return Fireworks.normalize({...base,...old,view:old?.view??(old?'mid':base.view),ending:old?.ending??(old?'ring':base.ending)});
  }
  const slots={
    A:loadSlot('A',initial),
    B:loadSlot('B',{...initial,trigger:'chord',shapes:['peony']})
  };
  function remember(){
    try{localStorage.setItem(storageKey,JSON.stringify({...slots,slot}))}catch{}
  }
  function pickPanel(tuning){
    document.body.classList.toggle('tuningOpen',tuning);
    $('program').hidden=tuning;$('tuning').hidden=!tuning;
    $('showTuning').setAttribute('aria-pressed',tuning);
    $('showTracks').setAttribute('aria-pressed',!tuning);
  }
  $('showTracks').onclick=()=>pickPanel(false);
  $('showTuning').onclick=()=>pickPanel(true);
  const shapeButtons=Object.entries(Fireworks.kinds).map(([kind,title])=>{
    const b=document.createElement('button');b.type='button';b.textContent=title;
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
    $('decayValue').textContent=cfg.decay.toFixed(2)+' 秒';
    $('offsetValue').textContent=cfg.offset===0?'同步 · 0 ms':(cfg.offset<0?'提前 ':'延后 ')+Math.abs(cfg.offset)+' ms';
    for(const key of ['brightness','overlap','height','attack','decay','offset'])$(key).setAttribute('aria-valuetext',$(key+'Value').textContent);
    previewUI?.sync(slots,slot);
  }
  function commit(){
    display();app.configure(slots[slot]);remember();
  }
  function update(key,value){
    slots[slot]=Fireworks.normalize({...slots[slot],[key]:value});commit();
  }
  for(const key of ['trigger','staging','salvos','ending','palette','camera','view','backdrop'])$(key).onchange=e=>update(key,e.target.value);
  $('windDirection').onchange=e=>update('windDirection',Number(e.target.value));
  for(const key of ['brightness','overlap','height','attack','decay','offset','shotTime','windSpeed'])$(key).oninput=e=>update(key,Number(e.target.value));
  for(const key of ['launch','finale'])$(key).onchange=e=>update(key,e.target.checked);
  for(const id of ['A','B'])$('slot'+id).onclick=()=>{slot=id;commit()};
  $('resetMix').onclick=()=>{slots[slot]=Fireworks.normalize(initial);commit()};
  display();pickPanel(true);
  return slots[slot];
}
