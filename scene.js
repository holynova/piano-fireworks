// Viewing distance, eye elevation and target elevation are in metres.
// For ground observers the elevation includes the height of the bank or terrace.
const shoreViews={
  mid:   {distance:570, eye:18.75,target:134, angle:0,    lens:1.12},
  near:  {distance:310, eye:5.2,  target:150, angle:.27,  lens:1.08},
  ground:{distance:145, eye:1.65, target:160, angle:-.10, lens:.83}
};

class FireworkStage {
  constructor(canvas,frameSize) {
    this.canvas=canvas;
    this.fireLayer=document.createElement('canvas');
    this.fireCtx=this.fireLayer.getContext('2d');
    this.ctx=canvas.getContext('2d',{alpha:false});
    this.cache=new WeakMap();
    this.config=Fireworks.normalize();
    this.motion=this.config.camera;
    this.track=null;
    this.script={list:[],peak:null};
    const rand=Fireworks.random(712);
    this.stars=Array.from({length:920},()=>{
      const azimuth=(rand()-.5)*Math.PI*1.6,y=rand(),r=Math.sqrt(1-y*y);
      return [r*Math.sin(azimuth),y,-r*Math.cos(azimuth),.3+rand()*.78,rand()*6];
    });
    this.city=[this.makeCity(0,rand),this.makeCity(1,rand),this.makeCity(2,rand)];
    this.terrain=new Map();
    this.galaxy=Landscapes.galaxy();
    this.ripples=Array.from({length:260},()=>[(rand()-.5)*135,-49+rand()*65,.12+rand()*.58,rand()*6]);
    this.glows=new Map();
    this.reflection=document.createElement('canvas');
    this.reflectionCtx=this.reflection.getContext('2d',{alpha:false});
    this.resize(frameSize);
  }
  resize(frameSize){
    const r=frameSize||this.canvas.getBoundingClientRect();
    this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);
    // Limit the drawing buffer on very large displays while retaining fine trails.
    const ratio=frameSize?1:Math.min(devicePixelRatio||1,1.6,1800/this.w);
    this.canvas.width=Math.max(1,Math.round(this.w*ratio));
    this.canvas.height=Math.max(1,Math.round(this.h*ratio));
    this.ctx.setTransform(this.canvas.width/this.w,0,0,this.canvas.height/this.h,0,0);
    this.fireLayer.width=this.canvas.width;this.fireLayer.height=this.canvas.height;
    this.fireCtx.setTransform(this.canvas.width/this.w,0,0,this.canvas.height/this.h,0,0);
    this.fireCtx.lineCap='round';
    this.reflection.width=Math.max(1,Math.round(this.w*.65));this.reflection.height=Math.max(1,Math.round(this.h*.65));
    if(!this.clouds)this.createSky();
  }
  makeCity(layer,rand) {
    const c=document.createElement('canvas');c.width=2200;c.height=154;
    const g=c.getContext('2d');let x=0;
    const fills=Landscapes.scenes.city.fills;
    while(x<c.width) {
      const width=8+rand()*(20+5*layer),height=6+rand()**1.7*(54+layer*8);
      const top=c.height-height;
      g.fillStyle=fills[layer];g.fillRect(x,top,width,height);
      if(rand()<.3){g.fillRect(x+width*.22,top-3,width*.56,4)}
      if(rand()<.08){g.fillRect(x+width*.6,top-8,1,8)}
      for(let y=top+3;y<c.height-3;y+=4)for(let xx=x+2;xx<x+width-2;xx+=3.6){
        if(rand()>.25)continue;
        g.fillStyle=rand()<.68?'rgba(255,194,128,'+(.19+rand()*.65)+')':'rgba(172,200,219,'+(.21+rand()*.47)+')';
        g.fillRect(xx,y,1.35,.95);
      }
      x+=width+rand()*3;
    }
    return c;
  }
  createSky(){
    // A seeded, low-frequency haze texture avoids repainting noise per animation frame.
    const c=document.createElement('canvas');c.width=720;c.height=360;
    const g=c.getContext('2d'),rand=Fireworks.random(371);
    for(let i=0;i<70;i++){
      const x=rand()*760-20,y=100+rand()*230,rad=24+rand()*100;
      const a=g.createRadialGradient(x,y,0,x,y,rad);
      a.addColorStop(0,i%3?'rgba(39,49,76,.025)':'rgba(51,54,70,.024)');a.addColorStop(1,'transparent');
      g.fillStyle=a;g.fillRect(x-rad,y-rad,rad*2,rad*2);
    }
    this.clouds=c;
    const wisps=document.createElement('canvas');wisps.width=960;wisps.height=180;
    const brush=wisps.getContext('2d');
    for(let i=0;i<54;i++){
      const x=rand()*1080-60,y=35+rand()*125,width=20+rand()**2*185;
      brush.save();brush.translate(x,y);brush.rotate(-.025+.05*rand());brush.scale(width,1+rand()*5);
      const streak=brush.createRadialGradient(0,0,0,0,0,1);
      streak.addColorStop(0,'rgba(96,112,139,.045)');streak.addColorStop(1,'rgba(96,112,139,0)');
      brush.fillStyle=streak;brush.fillRect(-1,-1,2,2);brush.restore();
    }
    this.wisps=wisps;
  }
  select(track,config=this.config) {
    this.track=track;this.config=config;this.motion=config.camera;
    this.script=Fireworks.build(track,config);
    this.preview=Fireworks.previewFor(config);
    this.cache=new WeakMap();
  }
  cameraPose(viewId,t,poster){
    const moving=!poster && this.motion!=='fixed',fly=this.motion==='fly';
    const phase=moving?t*2*Math.PI/(fly?58:88):0;
    const sway=Math.sin(phase),sweep=(1-Math.cos(phase))*.5;
    const scale=Fireworks.metres,tz=Fireworks.bankZ;
    let angle,distance,eye,aim,lens,tx=0;
    if(viewId==='drone'){
      // A level gimbal looks across the display on a rising and descending arc.
      angle=.30+(fly?.72:.46)*sway;
      distance=385-(fly?130:65)*sweep;
      eye=178+(fly?85:48)*sweep;
      aim=133+6*sweep;lens=.97;
    }else{
      const view=shoreViews[viewId];
      const ground=viewId==='ground';
      // Translate along the bank and turn the head gently at a standing eye level.
      angle=view.angle+(fly?.14:.024)*sway;
      distance=view.distance*(1-(fly?.10:.012)*sweep);
      eye=view.eye;
      aim=view.target+(ground?6:2)*sway;
      tx=(ground?.26:.11)*sway;lens=view.lens;
      if(ground && moving && this.config.launch && t<0){
        const progress=Math.max(0,Math.min(1,1-t/this.script.firstLaunch));
        aim*=.14+.86*progress*(2-progress);
      }
    }
    const ex=Math.sin(angle)*distance/scale,ey=eye/scale,ez=tz+Math.cos(angle)*distance/scale;
    const ty=aim*this.config.height/(100*scale);
    const peak=this.script.peak;
    const wide=!moving||peak==null?0:Math.max(0,1-Math.abs(t-peak-.5)/8);
    return {ex,ey,ez,tx,ty,tz,f:Math.min(this.h*lens*(1-.08*wide),this.w*(viewId==='drone'?.76:.98))};
  }
  camera(t,poster){
    const cfg=this.config;
    let view=cfg.view,blend=0,next;
    if(view==='auto'){
      const clock=poster?0:Math.max(0,t),shot=Math.floor(clock/cfg.shotTime);
      view=cfg.tourViews[shot%cfg.tourViews.length];
      next=cfg.tourViews[(shot+1)%cfg.tourViews.length];
      const transition=cfg.shotTime*.48;
      const u=Math.max(0,(clock%cfg.shotTime-cfg.shotTime+transition)/transition);
      blend=u*u*u*(10+u*(-15+6*u));
    }
    const pose=this.cameraPose(view,t,poster);
    if(blend>0){
      const end=this.cameraPose(next,t,poster);
      for(const key of Object.keys(pose))pose[key]+=(end[key]-pose[key])*blend;
    }
    const {ex,ey,ez,tx,ty,tz,f}=pose;
    const x=tx-ex,y=ty-ey,z=tz-ez,len=Math.hypot(x,y,z);
    const fx=x/len,fy=y/len,fz=z/len,hor=Math.hypot(fx,fz),rx=-fz/hor,rz=fx/hor;
    this.cam={ex,ey,ez,fx,fy,fz,rx,rz,ux:-fy*fx/hor,uy:hor,uz:-fy*fz/hor,f};
  }
  project(x,y,z){
    const c=this.cam,dx=x-c.ex,dy=y-c.ey,dz=z-c.ez;
    const d=dx*c.fx+dy*c.fy+dz*c.fz;
    if(d<2.1)return null;
    const scale=c.f/d;
    return [this.w*.5+(dx*c.rx+dz*c.rz)*scale,this.h*.48-(dx*c.ux+dy*c.uy+dz*c.uz)*scale,scale];
  }
  glow(ctx,x,y,r,color,opacity){
    if(r<.35||opacity<.006)return;
    let sprite=this.glows.get(color);
    if(!sprite){
      sprite=document.createElement('canvas');sprite.width=sprite.height=96;
      const g=sprite.getContext('2d'),grad=g.createRadialGradient(48,48,0,48,48,48);
      for(const [p,a] of [[0,'ef'],[.035,'c9'],[.12,'72'],[.29,'29'],[.62,'0b'],[1,'00']])grad.addColorStop(p,color+a);
      g.fillStyle=grad;g.fillRect(0,0,96,96);this.glows.set(color,sprite);
    }
    ctx.globalAlpha=Math.min(1,opacity);ctx.drawImage(sprite,x-r,y-r,r*2,r*2);
  }
  background(t,id,look){
    const g=this.ctx,w=this.w,h=this.h,c=this.cam;
    const horizon=this.project(0,0,-5000)[1],shore=this.project(0,0,look.depths[2])[1];
    const sky=g.createLinearGradient(0,0,0,Math.max(1,shore));
    [0,.53,.84,1].forEach((stop,i)=>sky.addColorStop(stop,look.sky[i]));
    g.fillStyle=sky;g.fillRect(0,0,w,h);
    g.drawImage(this.clouds,-w*(.14+c.fx*.12),shore-h*.93,w*1.28,h*.99);
    if(id==='coast')g.drawImage(this.wisps,-w*(.14+c.fx*.12),horizon-h*.56,w*1.28,h*.54);
    this.drawStars(this.stars,t,horizon,look.stars);
    if(id==='prairie')this.drawStars(this.galaxy,t,horizon,.68,true);
    if(id==='alpine'){
      const moon=this.project(-470,620,-1550);
      if(moon){
        const [x,y,scale]=moon,r=Math.max(1,7.4*scale);
        this.glow(g,x,y,r*3.3,'#d3e3e3',.23);
        g.globalAlpha=.85;g.fillStyle='#d3dfde';g.beginPath();
        g.arc(x,y,r,-1.5,1.65);g.bezierCurveTo(x+r*.82,y+r*.48,x+r*.78,y-r*.64,x+r*.07,y-r);g.fill();
        g.globalAlpha=1;
      }
    }
    if(id==='coast'){
      g.fillStyle=look.water;
      g.fillRect(0,horizon,w,Math.max(0,shore-horizon)+1);
    }
    let layers=this.city;
    if(id!=='city'){
      if(!this.terrain.has(id))this.terrain.set(id,look.depths.map((_,i)=>Landscapes.terrain(id,i)));
      layers=this.terrain.get(id);
    }
    for(let i=0;i<layers.length;i++){
      const p=this.project(0,0,look.depths[i]),scale=p[2]*look.texel,layer=layers[i];
      const width=layer.width*scale,height=layer.height*scale;
      if(id!=='coast'){
        g.fillStyle=look.fills[i];
        g.fillRect(0,p[1]-.5,w,Math.max(0,shore-p[1]+1));
      }
      const offset=((p[0]-width*.5)%width+width)%width-width;
      for(let x=offset;x<w;x+=width)g.drawImage(layer,x,p[1]-height,width+.4,height);
    }
    if(id==='city'){
      g.fillStyle='#101829';g.fillRect(0,shore-2,w,4);
      const dx=Math.max(7,c.f/(c.ez+50)*1.6);
      for(let x=((this.project(0,0,-50)[0]%dx)+dx)%dx;x<w;x+=dx){
        g.fillStyle='#d5ab81';g.fillRect(x,shore-2,1.7,1);this.glow(g,x,shore-2,4,'#ffbd83',.42);
        g.globalAlpha=1;
      }
    }else if(id==='coast')this.lighthouse();
    return shore;
  }
  drawStars(stars,t,horizon,brightness,dust=false){
    const g=this.ctx,c=this.cam,w=this.w,h=this.h;
    for(const [dx,dy,dz,s,phase] of stars){
      // Stars are directions at infinity. A standing observer and a drone see the
      // same sky rotate with the lens, while the shore and platforms show parallax.
      const depth=dx*c.fx+dy*c.fy+dz*c.fz;
      if(depth<=0)continue;
      const x=w*.5+(dx*c.rx+dz*c.rz)*c.f/depth;
      const y=h*.48-(dx*c.ux+dy*c.uy+dz*c.uz)*c.f/depth;
      if(x<0||x>w||y<0||y>h||y>horizon)continue;
      if(dust && phase<1.2){
        const radius=(.045+.15*s)*c.f/depth;
        this.glow(g,x,y,radius,phase<.6?'#a9a9c7':'#a99bb0',.034+.022*s);
      }
      g.globalAlpha=brightness*(.19+.48*s)*(.9+.1*Math.sin(phase+t*.6));g.fillStyle='#dbe6ff';g.fillRect(x,y,s,s);
    }
    g.globalAlpha=1;
  }
  lighthouse(){
    const g=this.ctx,p=this.project(-38,0,-106);
    if(!p)return;
    const [x,y,scale]=p;
    g.save();g.translate(x,y);g.scale(scale,scale);
    g.fillStyle='#262937';g.beginPath();g.moveTo(-13,0);g.quadraticCurveTo(-8,-.4,-4,-1.55);
    g.lineTo(-1.5,-1.32);g.lineTo(.8,-1.55);g.lineTo(3.1,-.84);g.lineTo(3.4,-.41);g.lineTo(8,0);g.fill();
    g.fillStyle='#b2a092';g.beginPath();g.moveTo(-.38,-1.25);g.lineTo(-.20,-3.58);
    g.lineTo(.20,-3.58);g.lineTo(.38,-1.25);g.fill();
    g.fillStyle='#684b50';g.fillRect(-.24,-2.98,.48,.40);
    g.fillStyle='#e4c092';g.fillRect(-.19,-3.96,.38,.35);
    g.fillStyle='#3c3340';g.beginPath();g.moveTo(-.35,-3.99);g.lineTo(0,-4.26);g.lineTo(.35,-3.99);g.fill();
    g.restore();
    this.glow(g,x,y-3.8*scale,Math.max(3,scale*1.1),'#ffe0ab',.48);g.globalAlpha=1;
  }
  meadow(shore){
    const g=this.ctx,w=this.w,h=this.h;
    if(shore>=h)return;
    const field=g.createLinearGradient(0,shore,0,h);
    field.addColorStop(0,'#15201e');field.addColorStop(.42,'#101a18');field.addColorStop(1,'#0a1112');
    g.fillStyle=field;g.fillRect(0,shore,w,h-shore);
    // A winding track gives the aerial view a scale cue on dry land.
    let previous=null;
    g.fillStyle='#202824';g.beginPath();
    for(let z=Landscapes.scenes.prairie.depths[2];z<68;z+=1.2){
      const x=-14+4*Math.sin(z*.077)+1.4*Math.sin(z*.127);
      const left=this.project(x-.14,.02,z),right=this.project(x+.14,.02,z);
      if(!left||!right)break;
      if(previous){g.moveTo(previous[0][0],previous[0][1]);g.lineTo(left[0],left[1]);
        g.lineTo(right[0],right[1]);g.lineTo(previous[1][0],previous[1][1]);g.closePath()}
      previous=[left,right];
    }
    g.fill();
    g.strokeStyle='#334036';g.lineWidth=.7;g.globalAlpha=.52;g.beginPath();
    for(const [x,z,length] of this.ripples){
      const p=this.project(x,.04,z);
      if(!p||p[1]<shore||p[1]>h||p[0]<0||p[0]>w)continue;
      const size=Math.min(7,p[2]*length*.24);
      g.moveTo(p[0]-size,p[1]-size*.64);g.lineTo(p[0],p[1]);g.lineTo(p[0]+size*.55,p[1]-size);
    }
    g.stroke();g.globalAlpha=1;
  }
  water(t,shore,look){
    const g=this.ctx,w=this.w,h=this.h;
    if(shore>=h-2)return;
    g.fillStyle=look.water;g.fillRect(0,shore,w,h-shore);
    this.reflectionCtx.drawImage(this.canvas,0,0,this.reflection.width,this.reflection.height);
    const ry=this.reflection.height/h;
    // Distant shore and skyline reflected across the far edge of the water.
    for(let y=0;y<h-shore;){
      const u=y/(h-shore),step=1+u*2.7,src=shore-1-y;
      if(src<=2)break;
      const ripple=Math.sin(y*.49+t*1.65)*.55+Math.sin(y*.137-t*1.23)*.74+Math.sin(y*.87+t)*.3;
      const dx=look.waves*ripple*(.6+u*6);
      g.globalAlpha=(.44-.14*u)*(.87+.13*Math.sin(y*.9-t));
      g.drawImage(this.reflection,0,Math.max(0,(src-step)*ry),this.reflection.width,Math.max(1,step*ry),dx,shore+y,w,step+.72);
      y+=step;
    }
    if(this.cam.ey>3||look===Landscapes.scenes.coast){
      g.strokeStyle='#7c8b9c';g.lineWidth=.75;g.globalAlpha=.16;g.beginPath();
      for(const [x,z,length,phase] of this.ripples){
        const p=this.project(x,0,z);
        if(!p||p[1]<shore||p[1]>h||p[0]<0||p[0]>w)continue;
        const half=p[2]*length*(.68+.32*Math.sin(t*1.1+phase));
        g.moveTo(p[0]-half,p[1]);g.lineTo(p[0]+half,p[1]);
      }
      g.stroke();
    }
    g.globalAlpha=1;
  }
  pontoons(){
    const g=this.ctx;
    for(const x of Fireworks.banks){
      const z=Fireworks.bankZ,deck=Fireworks.deck;
      const corners=[[-.64,-.21],[.64,-.21],[.64,.21],[-.64,.21]];
      const top=corners.map(([dx,dz])=>this.project(x+dx,deck,z+dz));
      const base=this.project(x+.64,0,z+.21);
      if(!base||top.some(p=>!p))continue;
      g.fillStyle='#161e29';g.beginPath();
      top.forEach(([px,py],i)=>{if(i)g.lineTo(px,py);else g.moveTo(px,py)});
      g.closePath();g.fill();
      g.fillStyle='#0d151e';g.beginPath();g.moveTo(top[3][0],top[3][1]);
      g.lineTo(top[2][0],top[2][1]);g.lineTo(base[0],base[1]);
      g.lineTo(top[3][0],top[3][1]+Math.max(.7,base[1]-top[2][1]));g.closePath();g.fill();
      g.fillStyle='#aa8261';g.fillRect(top[0][0],top[0][1]-.7,1.3,.8);
    }
  }
  reflectFire(t,shore,waves){
    // Reflect the vertical plane through the display, using camera pitch and eye height.
    // Particles a little in front of or behind this plane share its water ripple.
    const g=this.ctx,c=this.cam,w=this.w,h=this.h;
    const depth=((Fireworks.bankZ-c.ez)*c.fz-c.ex*c.fx)/c.uy;
    const ratio=this.fireLayer.height/h;
    const waterline=this.project(0,0,Fireworks.bankZ)[1];
    for(let y=Math.max(shore,waterline);y<h;){
      const v=(h*.48-y)/c.f;
      const mirrored=c.ey+depth*(c.fy+v*c.uy)/(c.uy-v*c.fy);
      const height=-mirrored-c.ey;
      const distance=depth*c.uy+height*c.fy;
      const src=h*.48-c.f*(height*c.uy-depth*c.fy)/distance;
      if(src<=0)break;
      const stretch=distance/(depth*c.uy+(mirrored-c.ey)*c.fy);
      const u=Math.min(1,(y-waterline)/Math.max(1,h-waterline)),step=1.4+2.3*u;
      const ripple=Math.sin(y*.42+t*1.1)+.53*Math.sin(y*.17-t*.84);
      const span=w*stretch;
      g.globalAlpha=this.config.brightness/100*(.27-.09*u)*(.7+.3*Math.cos(y*.83+t));
      g.drawImage(this.fireLayer,0,Math.max(0,(src-step)*ratio),this.fireLayer.width,Math.max(1,step*ratio),
        (w-span)*.5+waves*ripple*(.65+4*u),y,span,step+.3);
      y+=step;
    }
    g.globalAlpha=1;
  }
  liftDrift(seconds){
    return .28*(seconds+Math.expm1(-.54*seconds)/.54);
  }
  comet(s,age){
    const g=this.fireCtx,at=a=>{
      const [x,y,z]=Fireworks.flight(s,a),shift=this.liftDrift(Math.max(0,a+s.lead));
      return this.project(x+this.windX*shift,y,z+this.windZ*shift);
    };
    const p=at(age),q=at(age-.18),r=at(age-.065);
    if(!p||!q||!r)return;
    const width=Math.max(.85,Math.min(2.1,p[2]*.065));
    const light=(.79+.10*Math.sin(age*14+s.seed))*(.8+.2*Math.min(1,-age/.35));
    g.strokeStyle='#e6a364';g.lineWidth=width;
    g.globalAlpha=light*.38;g.beginPath();g.moveTo(q[0],q[1]);g.lineTo(r[0],r[1]);g.stroke();
    g.globalAlpha=light;g.beginPath();g.moveTo(r[0],r[1]);g.lineTo(p[0],p[1]);g.stroke();
    g.fillStyle='#ffe0a6';g.beginPath();g.arc(p[0],p[1],width*.68,0,Math.PI*2);g.fill();
    this.glow(g,p[0],p[1],width*3.4,'#ffc37b',light*.62);
    g.globalAlpha=1;
  }
  shell(s,t,poster){
    const g=this.fireCtx,elapsed=t-s.t;
    const separation=this.config.overlap/100;
    const crowd=(s.crowd||0)*separation;
    const cy=s.cy;
    if(elapsed<0){if(this.config.launch && s.tracer && elapsed>=-s.lead)this.comet(s,elapsed);return}
    const duration=this.config.decay*(1-.60*crowd);
    const age=elapsed;
    if(s.noteBurst && elapsed>duration)return;
    if(age>3.15)return;
    const fade=s.noteBurst?Math.min(1,(duration-age)/Math.min(.35,duration*.35)):1;
    const size=s.size*(1-.36*crowd);
    const shift=this.liftDrift(s.lead),cx=s.cx+shift*this.windX,cz=s.z+shift*this.windZ;
    const p=this.project(cx,cy,cz);
    if(!p)return;
    const [x,y,scale]=p,R=scale*size;
    if(x<-R*2||x>this.w+R*2||y<-R*2||y>this.h+R*2)return;
    const colors=Fireworks.palettes[s.color];
    this.glow(g,x,y,R*(1.55+age*.45),colors[0],fade*.20*(1-.55*crowd)*Math.exp(-.9*age));
    this.glow(g,x,y,Math.max(3,R*.55),colors[0],fade*.85*Math.exp(-age*13));
    // A short, local attack reads at hammer-on, before the particle cloud expands.
    if(!poster && s.noteBurst && elapsed<.12 && this.config.attack>0){
      const pulse=(1-elapsed/.12)**2*this.config.attack/100;
      const radius=Math.max(2,Math.min(8,R*.105));
      this.glow(g,x,y,radius*4,colors[0],pulse);
      g.globalAlpha=pulse;g.fillStyle=colors[1];g.beginPath();
      g.arc(x,y,radius*(.72+.28*elapsed/.12),0,Math.PI*2);g.fill();
    }
    g.globalAlpha=1;
    let ps=this.cache.get(s);if(!ps){ps=Fireworks.particles(s);this.cache.set(s,ps)}
    const bins=Array.from({length:12},()=>new Path2D());
    const tips=new Path2D(),anchors=new Path2D();
    const tails=Array.from({length:3},()=>new Path2D());
    const isCross=s.kind==='cross', flash=s.kind==='strobe';
    // A shell's stars share a drag coefficient and trail length. Evaluate their
    // three sample times once before projecting the individual directions.
    const {drag,tail}=ps[0],inherited=.28*(-Math.expm1(-.54*s.lead));
    const sample=a=>{
      const expansion=-Math.expm1(-drag*a),settling=a-expansion/drag;
      return {distance:size*expansion,drop:Fireworks.gravity/drag*settling,drift:settling+inherited*expansion/drag,
        split:isCross?Math.max(0,a-.47)*size*.66:0};
    };
    const head=sample(age),trail=sample(Math.max(0,age-tail));
    const longTrail=tail>.14?sample(Math.max(0,age-tail*2.4)):null;
    const point=(v,{distance,drop,drift,split})=>{
      return this.project(cx+v.dx*distance+(v.split===0?split:v.split===1?-split:0)+this.windX*drift,
        cy+v.dy*distance-drop+(v.split===2?split:v.split===3?-split:0),
        cz+v.dz*distance+this.windZ*drift);
    };
    const twinkle=s.kind==='crown'||s.kind==='willow';
    for(const v of ps){
      if(age>=v.life)continue;
      const a=point(v,head),b=point(v,trail);
      if(!a||!b)continue;
      let light=Math.min(1,(v.life-age)*2.9)*v.lum;
      if(flash)light*=.24+.76*(.5+.5*Math.cos(age*22+v.phase))**2;
      if(twinkle)light*=.57+.43*Math.sin(v.phase+age*11)**2;
      if(light>.56 && v.phase>2.8){
        tips.moveTo(a[0],a[1]);tips.lineTo(a[0]+.17,a[1]+.16);
        if(v.phase>5.55){anchors.moveTo(a[0],a[1]);anchors.lineTo(a[0]+.1,a[1]+.1)}
      }
      const path=bins[v.tint*4+Math.min(3,Math.floor(light*4))];
      path.moveTo(b[0],b[1]);path.lineTo(a[0]+.12,a[1]+.12);
      if(longTrail && age>.09){
        const c=point(v,longTrail);
        if(c){tails[v.tint].moveTo(c[0],c[1]);tails[v.tint].quadraticCurveTo(b[0],b[1],a[0],a[1])}
      }
    }
    const width=Math.max(.72,Math.min(2.25,scale*.071))*(1-.18*crowd)*(s.kind==='dahlia'?1.5:1);
    for(let j=0;j<3;j++){
      g.strokeStyle=colors[2];g.globalAlpha=.27*fade;g.lineWidth=width*.8;g.stroke(tails[j]);
      g.strokeStyle=colors[j];
      for(let k=0;k<4;k++){
        const path=bins[j*4+k];g.globalAlpha=(k+1)*.23*fade;g.lineWidth=width;g.stroke(path);
        if(k>1){g.globalAlpha=(k-1)*.052*fade;g.lineWidth=width*2.7;g.stroke(path)}
      }
    }
    g.strokeStyle=colors[1];g.lineWidth=width*1.22;g.globalAlpha=.8*fade;g.stroke(tips);
    g.strokeStyle=colors[0];g.lineWidth=width*3.6;g.globalAlpha=.075*fade;g.stroke(tips);
    g.strokeStyle=colors[1];g.lineWidth=width*1.24;g.globalAlpha=.56*fade;g.stroke(anchors);
    g.globalAlpha=1;
  }
  render(time,poster=false){
    const t=poster ? .90 : time-this.config.offset/1000,g=this.ctx;
    const backdrop=Landscapes.resolve(this.config.backdrop,this.track),look=Landscapes.scenes[backdrop];
    const wind=this.config.windSpeed/Fireworks.metres,angle=this.config.windDirection*Math.PI/180;
    this.windX=wind*Math.cos(angle);this.windZ=-wind*Math.sin(angle);
    this.camera(t,poster);
    const shore=this.background(t,backdrop,look);
    if(look.water){this.water(t,shore,look);this.pontoons()}
    else this.meadow(shore);
    // Composite the transparent effects layer once: overlapping sparks blend in their
    // palette, and all of them together share the same upper brightness limit.
    this.fireCtx.clearRect(0,0,this.w,this.h);
    let latest=null;
    const list=poster?this.preview:this.script.list;
    // Binary-search for visible trajectories, including the leads of upcoming comets.
    let lo=0,hi=list.length;
    while(lo<hi){const m=(lo+hi)>>1;if(list[m].t<t-3.16)lo=m+1;else hi=m}
    const ahead=poster?Infinity:this.config.launch?this.script.maxLead:0;
    for(let i=lo;i<list.length&&list[i].t<=t+ahead;i++){
      this.shell(list[i],t,poster);if(list[i].t<=t)latest=list[i];
    }
    g.globalAlpha=this.config.brightness/100;
    g.drawImage(this.fireLayer,0,0,this.w,this.h);
    g.globalAlpha=1;
    if(look.water)this.reflectFire(t,shore,look.waves);
    return latest?Fireworks.kinds[latest.kind]:'升空';
  }
}
