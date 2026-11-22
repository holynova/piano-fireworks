// Positions are in stage space. Every trajectory is a function of score time, so seeking is exact.
window.Fireworks = (() => {
  const tau = 2 * Math.PI;
  function random(seed) {
    let n = seed >>> 0;
    return () => ((n = (Math.imul(1664525, n) + 1013904223) >>> 0) / 4294967296);
  }
  const kinds = {
    peony:'牡丹', chrys:'菊花', willow:'垂柳', palm:'棕榈', ring:'彩环', crown:'锦冠',
    cross:'十字星', strobe:'银闪', horsetail:'马尾', dahlia:'大丽花', fan:'扇形花束', tworing:'双环'
  };
  // Main stars, bright cores and fading embers, in display-referred sRGB.
  const palettes=[
    ['#ffb54e','#ffe2a0','#bf6625'], ['#ff4435','#ff9b78','#9a2c22'],
    ['#50d765','#b6f096','#298342'], ['#b178d9','#d5afea','#74438c'],
    ['#547bdd','#a0baff','#354d98'], ['#ff8636','#ffd180','#a64e20'],
    ['#eee9ce','#fff8dc','#a77c51'], ['#ffc54e','#ffdf8a','#c7832e'],
    ['#d9dadd','#f6f3e9','#9296a2']
  ];
  const themes={gold:[0],silver:[8],red:[1],green:[2],ice:[4],duo:[0,8],
    classic:[0,1,0,2,8],all:[0,1,2,3,4,5,6,7]};
  const tourViews=['mid','near','closeup','ground','drone'];
  const defaults={look:'live',theme:'fireworks',trigger:'chord',shapes:['peony','chrys','willow','palm','crown','strobe','horsetail','dahlia'],palette:'classic',offset:0,
    brightness:90,overlap:75,height:100,decay:1.25,attack:75,salvos:'phrases',finale:true,launch:true,camera:'fly',view:'auto',tourViews:['near','ground','drone'],shotTime:8,windSpeed:4,windDirection:0,backdrop:'city',staging:'score',ending:'score'};
  function normalize(input={}) {
    const shapes=Array.isArray(input.shapes)?Object.keys(kinds).filter(k=>input.shapes.includes(k)):[];
    const limit=(key,min,max)=>Number.isFinite(input[key])?Math.max(min,Math.min(max,input[key])):defaults[key];
    const selected=Array.isArray(input.tourViews)?tourViews.filter(id=>input.tourViews.includes(id)):[];
    // Migrate the retired far camera in previously saved A/B configurations.
    if(Array.isArray(input.tourViews) && input.tourViews.includes('far') && selected.length<2){
      for(const id of ['mid','near'])if(selected.length<2 && !selected.includes(id))selected.push(id);
    }
    const view=input.view==='far'?'mid':input.view;
    return {
      look:input.look==='classic'?'classic':defaults.look,theme:defaults.theme,
      tourViews:selected.length>=2?selected:[...defaults.tourViews],shotTime:limit('shotTime',4,20),
      windSpeed:limit('windSpeed',0,12),windDirection:[0,45,90,135,180,225,270,315].includes(input.windDirection)?input.windDirection:0,
      staging:['fixed','scatter'].includes(input.staging)?input.staging:'score',
      ending:['score','ring','fan','arc'].includes(input.ending)?input.ending:defaults.ending,
      shapes:shapes.length?shapes:[...defaults.shapes],
      trigger:['note','chord','accent'].includes(input.trigger)?input.trigger:defaults.trigger,
      palette:Object.hasOwn(themes,input.palette)?input.palette:defaults.palette,
      brightness:limit('brightness',20,100),overlap:limit('overlap',0,100),height:limit('height',75,120),
      offset:limit('offset',-200,200),decay:limit('decay',.25,3),attack:limit('attack',0,100),
      salvos:['off','phrases','more'].includes(input.salvos)?input.salvos:defaults.salvos,
      finale:typeof input.finale==='boolean'?input.finale:defaults.finale,
      launch:typeof input.launch==='boolean'?input.launch:defaults.launch,
      backdrop:Object.hasOwn(Landscapes.scenes,input.backdrop)?input.backdrop:defaults.backdrop,
      view:['auto',...tourViews].includes(view)?view:defaults.view,
      camera:['fly','glide','fixed'].includes(input.camera)?input.camera:defaults.camera
    };
  }
  // One stage unit is 15 m. Water is y=0. All motion uses score seconds.
  const metres=15, gravity=9.81/metres, deck=.13, bankZ=-15;
  const banks=[-9,-6,-3,0,3,6,9];
  const riseDrag=1.7, riseCurve=Math.expm1(riseDrag)-riseDrag;
  const riseFactor=riseCurve/(riseDrag*riseDrag);
  function cue(t,x,y,z,size,kind,color,seed) {
    return {t,x,y,z,size,kind,color,seed};
  }
  function planFlights(list,config) {
    const separation=config.overlap/100,scale=config.height/100;
    for(const s of list){
      s.cx=(s.x+(s.clearX||0)*separation)*scale;
      s.cy=(s.y+(s.clearY||0)*separation)*scale;
      s.z=bankZ+(s.z-bankZ)*scale;
      s.size*=scale;
      s.bank=banks.reduce((best,n)=>Math.abs(n-s.cx)<Math.abs(best-s.cx)?n:best,0);
      s.lead=Math.sqrt((s.cy-deck)/(gravity*riseFactor));
    }
    // Many aerial shells are hard to follow from shore. Space the visible tracers
    // per pontoon in busy passages while keeping every musical attack.
    const last=new Map();
    let maxLead=0,minLead=Infinity,firstLaunch=0,minHeight=Infinity,maxHeight=0;
    for(const s of [...list].sort((a,b)=>(a.t-a.lead)-(b.t-b.lead))){
      const start=s.t-s.lead;
      s.tracer=start-(last.get(s.bank)??-Infinity)>=1.65*separation;
      if(s.tracer){
        last.set(s.bank,start);
        firstLaunch=Math.min(firstLaunch,start);
      }
      minLead=Math.min(minLead,s.lead);maxLead=Math.max(maxLead,s.lead);
      minHeight=Math.min(minHeight,s.cy*metres);maxHeight=Math.max(maxHeight,s.cy*metres);
      if(s.formation)s.formation.lead=Math.max(s.formation.lead,s.lead);
    }
    return {minLead,maxLead,minHeight,maxHeight,firstLaunch};
  }
  function flight(s,elapsed){
    const left=Math.max(0,Math.min(1,-elapsed/s.lead));
    const phase=riseDrag*left;
    const y=s.cy-(s.cy-deck)*(Math.expm1(phase)-phase)/riseCurve;
    const drift=Math.expm1(phase)/Math.expm1(riseDrag);
    return [s.cx+(s.bank-s.cx)*drift,y,s.z+(bankZ-s.z)*drift];
  }
  function cueStylist(config,seed) {
    const colors=themes[config.palette],rand=random(seed);
    let lastTime,lastColor;
    return (s,i)=>{
      let color;
      if(config.palette==='classic'){
        // Keep gold's extra weight. Neighbouring shells in a volley contrast.
        const choices=s.t===lastTime?colors.filter(id=>id!==lastColor):colors;
        color=choices[Math.floor(rand()*choices.length)];
        lastTime=s.t;lastColor=color;
      }else{
        color=colors[i%colors.length];
      }
      return {...s,kind:config.shapes[i%config.shapes.length],color};
    };
  }
  function scatterPosition(rand,pitch){
    return [(rand()-.5)*18,10.5+2.7*Math.tanh((pitch-63)/20)+(rand()-.5)*4,bankZ+(rand()-.5)*5];
  }
  function planSpacing(list,live) {
    // Work in score order so a seek or dropped frame cannot change a note's position.
    // Compare only nearby attacks and give slightly more space to a simultaneous chord.
    const offsets=[[0,0],[-1,0],[1,0],[0,.9],[0,-.9],[-.8,.7],[.8,-.7],[.8,.7],[-.8,-.7]];
    if(live)offsets.push([-1.7,0],[1.7,0],[0,1.5],[0,-1.5]);
    let first=0;
    for(let i=0;i<list.length;i++){
      const s=list[i];
      while(s.t-list[first].t>.85)first++;
      let best=Infinity,dx=0,dy=0;
      for(const [ox,oy] of offsets){
        // Small displacement penalty leaves an isolated strike on its exact pitch lane.
        let cost=.15*(ox*ox+oy*oy);
        for(let j=first;j<i;j++){
          const prev=list[j],age=s.t-prev.t;
          const x=s.x+ox-prev.x-prev.clearX,y=s.y+oy-prev.y-prev.clearY;
          const depth=(s.z-prev.z)*.20;
          const radius=.72*(s.size+prev.size);
          const distance=(x*x+y*y+depth*depth)/(radius*radius);
          if(live && age<.28){
            const centerGap=x*x+y*y;
            cost+=4*Math.max(0,1-centerGap/2.25)*(1-age/.28);
          }
          if(distance<1)cost+=(1-distance)**2*(1-age/.85);
        }
        if(ox===0 && oy===0)s.crowd=cost/(1+cost);
        if(cost<best){best=cost;dx=ox;dy=oy}
      }
      s.clearX=dx;s.clearY=dy;
    }
  }
  function assignAccents(list,track,parts,threshold){
    let lastMain=-Infinity,phrase=0;
    for(let i=0;i<list.length;){
      const t=list[i].t;
      let end=i+1,voice=list[i];
      while(end<list.length&&list[end].t===t){
        if(list[end].velocity>=voice.velocity)voice=list[end];
        end++;
      }
      const newPhrase=phrase+1<parts.length && t>=parts[phrase+1].start;
      while(phrase+1<parts.length && t>=parts[phrase+1].start)phrase++;
      const gap=t-lastMain;
      const accented=voice.velocity>=threshold||end-i>=3;
      const beat=Choreography.beatAt(track,t);
      const strongBeat=Math.abs(beat-2*Math.round(beat/2))<.045&&voice.velocity>=threshold-10;
      const isMain=newPhrase||gap>=1.55||(gap>=.48&&accented)||(gap>=.32&&strongBeat);
      if(isMain)lastMain=t;
      for(let j=i;j<end;j++){
        if(isMain&&list[j]===voice)continue;
        list[j].compact=true;
        list[j].size*=.75;
      }
      i=end;
    }
  }
  function build(track,config=defaults) {
    const styleCue=cueStylist(config,Math.round(track.duration*1000)+track.notes.length);
    const placement=random(Math.round(track.duration*1000)^0x58e14b);
    const groups=[];
    for(const note of track.notes){
      const [t,p,v]=note;
      let g=groups.at(-1);
      if(!g || t!==g.t){g={t,notes:[],pitch:p,velocity:v};groups.push(g)}
      g.notes.push(note);g.pitch=Math.max(g.pitch,p);g.velocity=Math.max(g.velocity,v);
    }
    const tail=groups.filter(g=>g.t>track.duration*.86 && g.t<track.duration-.9);
    const weight=g=>g.notes.length+g.velocity/60;
    const climax=track.mode==='original'?12.15:tail.reduce((a,b)=>!a||weight(b)>=weight(a)?b:a,null)?.t;
    const peak=config.finale?climax:null;
    const strengths=groups.map(g=>g.velocity).sort((a,b)=>a-b);
    const threshold=strengths[Math.floor(strengths.length*.75)];
    const list=[];
    const parts=Choreography.sections(track,config.staging);
    const ending=Choreography.endingFor(track,config.ending);
    let lastAccent=-Infinity,serial=0;
    function add(t,pitch,velocity,rank,count,stroke){
      const spread=count>1?(rank/(count-1)-.5)*3:0;
      const section=parts[Choreography.sectionAt(parts,t)];
      const beat=Choreography.beatAt(track,t)-Choreography.beatAt(track,section.start);
      // A snare has a single MIDI key. Let the rhythm travel across the stage.
      const lane=stroke?63+22*Math.sin(beat*Math.PI/4):pitch;
      const [x,y,z]=section.form==='scatter'?scatterPosition(placement,lane):Choreography.position(section.form,t,beat,lane,spread);
      const scale=config.trigger==='note'?1:1.32;
      const size=(1.12+3.35*(velocity/110)**2)*scale/(1+.10*(count-1));
      const s=cue(t,x,y,z,size,'peony',0,7919+serial*29);
      s.velocity=velocity;s.pitch=pitch;
      s.noteBurst=true;
      const burst=styleCue(s,serial++);
      if(stroke){
        burst.stroke=stroke;
        if(stroke==='accent'){
          burst.y+=2;burst.size*=1.18;
        }else if(stroke==='roll' || stroke==='ghost'){
          burst.compact=true;
          burst.size*=stroke==='roll'?.52:.36;
          burst.y-=stroke==='roll'?1.6:3;
          const previous=list.at(-1);
          if(stroke==='roll' && previous?.stroke==='roll' && t-previous.t<.4){
            burst.kind=previous.kind;burst.color=previous.color;
          }
        }
      }
      list.push(burst);
    }
    for(const g of groups){
      if(config.trigger==='note'){
        const chord=g.notes.slice().sort((a,b)=>a[1]-b[1]);
        chord.forEach(([,p,v,stroke],rank)=>add(g.t,p,v,rank,chord.length,stroke));
      }else{
        const stroke=g.notes[0][3];
        if(config.trigger==='accent' && stroke && stroke!=='accent')continue;
        if(config.trigger==='accent' && !stroke){
          if((g.velocity<threshold && g.notes.length<3) || g.t-lastAccent<30/Choreography.tempoSegment(track,1,g.t)[2])continue;
          lastAccent=g.t;
        }
        add(g.t,g.pitch,g.velocity,0,1,stroke);
      }
    }
    if(config.look==='live' && !track.notes[0]?.[3])assignAccents(list,track,parts,threshold);
    planSpacing(list,config.look==='live');
    const count=list.length;
    const salvos=Choreography.salvos(track,config.salvos);
    function addFormation(formation,points,seed){
      points.forEach(([x,y,z,size],i)=>{
        const s=cue(formation.t,x,y,z,size,'peony',0,seed+i);
        s.formation=formation;
        list.push(styleCue(s,i));
      });
    }
    for(const formation of salvos){
      addFormation(formation,Choreography.salvoPoints(formation.form),110003+Math.round(formation.t*1000));
    }
    const finale={t:peak,lead:0};
    if(peak!=null)addFormation(finale,Choreography.endingPoints(ending),97411);
    if(salvos.length||peak!=null)list.sort((a,b)=>a.t-b.t);
    const flights=planFlights(list,config);
    return {list,peak,count,parts,ending,salvos,endingLead:finale.lead,...flights};
  }
  function particles(s) {
    const rand=random(s.seed), arr=[], k=s.kind;
    const counts={willow:192,chrys:328,peony:245,crown:224,ring:94,tworing:156,palm:94,
      fan:95,cross:88,horsetail:120,dahlia:164,strobe:176};
    const n=s.compact?32:s.noteBurst?Math.min(counts[k],Math.round(54+14*s.size)):s.size<1.4?46:counts[k];
    for(let i=0;i<n;i++){
      const u=(i+.5)/n, angle=i*2.39996323+rand()*.13;
      let yy=1-2*u, rr=Math.sqrt(1-yy*yy), dx=rr*Math.cos(angle), dz=rr*Math.sin(angle), dy=yy;
      let speed=.87+rand()*.23, drag=1.35, life=1.15+rand()*.64, tail=.09, thickness=.87;
      let tint=rand()<.23?1:0;
      if(k==='ring'||k==='tworing'){
        const a=i*tau/(k==='tworing'?n/2:n), inner=k==='tworing'&&i>=n/2;
        dx=Math.cos(a);dy=Math.sin(a)*(inner?.79:.95);dz=Math.sin(a)*(inner?-.63:.33);
        speed=(inner?.60:1)*(.98+.025*rand());tint=inner?2:0;
      }else if(k==='willow'||k==='crown'){
        dy=yy*.77+.33;tail=.30;life=2.05+rand()*.8;
        speed*=k==='willow'?1.10:1;drag=1.08;tint=rand()<.15?1:0;
      }else if(k==='palm'||k==='fan'){
        const a=k==='fan'?(-1.05+(i%7)/6*2.10):tau*(i%9)/9;
        dx=(k==='fan'?Math.sin(a):Math.cos(a))+(rand()-.5)*.085;
        dy=(k==='fan'?Math.cos(a):.42+.45*Math.sin(a))+(rand()-.5)*.06;
        dz=k==='fan'?(rand()-.5)*.18:Math.sin(a)*.67;
        speed=.68+.5*rand();tail=.26;life=1.45+rand()*.75;thickness=1.11;
      }else if(k==='horsetail'){
        dx=dx*.73+.37;dz*=.38;dy=.55+.43*rand();speed=.58+.61*rand();tail=.24;life=2.1+rand()*.55;
      }else if(k==='dahlia'){
        speed=(i%3===0?.50:1)*(.95+.06*rand());tint=i%3===0?2:0;thickness=1.52;tail=.045;
      }else if(k==='peony'){tail=.037;thickness=1.27}
      else if(k==='chrys'){tail=.19;speed=.55+.58*rand();tint=i%4===0?2:0}
      else if(k==='cross'){
        const a=tau*Math.floor(i/4)/Math.ceil(n/4);
        dx=Math.cos(a);dy=Math.sin(a);dz=.36*Math.sin(2*a);speed=.91;
        life=1.28+rand()*.25;tail=.11;
      }else if(k==='strobe'){tail=.027;life=1.70+rand()*.65;thickness=1.35}
      arr.push({dx:dx*speed,dy:dy*speed,dz:dz*speed,drag,life,tail,tint,thickness,
        phase:rand()*tau,split:i%4,lum:.63+.37*rand()});
    }
    return arr;
  }
  const preview=[
    cue(.04,-6.3,12.8,-12,5.55,'chrys',0,89),cue(.38,6.8,13.7,-17,4.85,'dahlia',3,491),
    cue(-.47,1.1,10.2,-18,4.2,'willow',7,530),cue(.54,-13.7,8,-16,3.1,'peony',2,851),
    cue(.35,12,7.1,-13,3.3,'palm',5,911),cue(1.52,-.3,15,-15,3,'ring',0,122),
  ];
  return {build,particles,kinds,palettes,random,defaults,normalize,
    metres,gravity,deck,banks,bankZ,flight,
    previewFor(config){
      const list=preview.map(cueStylist(config,371)).sort((a,b)=>a.t-b.t);
      if(config.staging==='scatter'){
        const rand=random(85023);
        for(const s of list)[s.x,s.y,s.z]=scatterPosition(rand,63);
      }
      planFlights(list,config);
      return list;
    }};
})();
