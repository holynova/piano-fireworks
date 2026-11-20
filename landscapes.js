// All terrain tiles repeat at their edges and stay at a fixed depth in stage space.
window.Landscapes=(()=>{
  const scenes={
    city:{name:'城市夜景',sky:['#010204','#03060c','#080e18','#131a23'],water:'#050a10',waves:1,stars:1,
      depths:[-105,-76,-50],fills:['#18212e','#121b26','#0c131d'],texel:.06},
    alpine:{name:'雪山静湖',sky:['#010305','#03080d','#0a1219','#121f26'],water:'#050d11',waves:.45,stars:.93,
      depths:[-164,-110,-66],fills:['#1e2a33','#15212a','#0c191e'],texel:.102},
    coast:{name:'深夜海湾',sky:['#020205','#060710','#0c101b','#181b27'],water:'#070b14',waves:1.65,stars:.48,
      depths:[-220,-148,-106],fills:['#1a1c28','#131722','#0d121c'],texel:.105},
    prairie:{name:'星河草原',sky:['#010204','#04050b','#090d16','#121822'],stars:1.14,
      depths:[-172,-110,-68],fills:['#191d26','#121b20','#0e191b'],texel:.095}
  };
  const programs={greensleeves:'prairie',cello:'alpine',entertainer:'city',turca:'coast',elise:'city',gymnopedie:'prairie',original:'city',prayer:'alpine',clair:'alpine',prelude:'prairie'};
  function resolve(choice,track){return Object.hasOwn(scenes,choice)?choice:programs[track?.id]||'city'}
  function noise(rand,count){
    const samples=Array.from({length:count},rand);
    return u=>{
      const i=Math.floor(u*count),f=u*count-i,k=f*f*(3-2*f);
      return samples[i%count]*(1-k)+samples[(i+1)%count]*k;
    };
  }
  function terrain(id,layer){
    const scene=scenes[id],rand=Fireworks.random(({alpine:453,coast:781,prairie:372})[id]+layer*113);
    const tile=document.createElement('canvas'),w=tile.width=4096,h=tile.height=id==='alpine'?[360,182,70][layer]:id==='coast'?128:92;
    const g=tile.getContext('2d'),broad=noise(rand,7),fine=noise(rand,43),grain=noise(rand,236);
    const outline=new Float32Array(w);
    const peaks=Array.from({length:16},(_,i)=>({
      x:(i+.18+rand()*.65)*w/16,
      height:35+rand()**1.35*210,width:120+rand()*330,aspect:.6+rand()*.95
    }));
    // Height profiles for the massif, its foothills and its wooded shoreline.
    for(let x=0;x<w;x++){
      const u=x/w,angle=u*2*Math.PI;
      const detail=fine(u)*.75+grain(u)*.25;
      let height;
      if(id==='alpine'){
        let relief=0;
        for(const peak of peaks){
          const dx=(x-peak.x+w*1.5)%w-w*.5;
          const slope=Math.abs(dx)*(dx<0?peak.aspect:1)/peak.width;
          relief=Math.max(relief,peak.height*Math.max(0,1-slope)**1.22);
        }
        height=[35,15,7][layer]+relief*[1,.44,.076][layer]+[55,43,12][layer]*broad(u)+[45,20,6][layer]*detail;
      }else if(id==='coast'){
        const islet=Math.max(0,Math.cos(angle*(layer+2)+2*Math.sin(angle)+layer*.8)-.28);
        height=islet*(15+80*broad(u)+25*detail)/(1+layer*.24);
      }else{
        height=[18,7,4][layer]+[40,28,12][layer]*broad(u)+[15,8,3][layer]*detail;
      }
      outline[x]=h-height;
    }
    const fill=g.createLinearGradient(0,0,0,h);
    fill.addColorStop(0,id==='alpine'?'#2e3c49':scene.fills[layer]);fill.addColorStop(1,scene.fills[layer]);
    g.fillStyle=fill;g.beginPath();g.moveTo(0,h);
    for(let x=0;x<w;x+=2)g.lineTo(x,outline[x]);
    g.lineTo(w,outline[0]);g.lineTo(w,h);g.fill();
    if(id==='alpine'&&layer===0){
      // Broken snowfields lie below the crest, divided by darker rock ribs.
      for(let x=0;x<w;x++){
        const u=x/w,top=outline[x];
        const slope=outline[(x+7)%w]-top;
        const snow=Math.max(0,(h-top-126)*.46+13*fine(u)-7*grain(u));
        g.fillStyle=slope>0?'#556676':'#354753';
        g.fillRect(x,top,1,snow*(.46+.54*fine((u*3)%1)));
        g.fillStyle='rgba(78,98,110,.18)';
        g.fillRect(x,top+snow,1,Math.max(0,16+slope)*broad(u));
      }
    }
    if(id==='alpine'&&layer===2){
      g.fillStyle='#0c181e';g.beginPath();
      for(let x=2;x<w-4;x+=3){
        const y=outline[x]+1,size=3+rand()*10;
        g.moveTo(x-size*.23,y);g.lineTo(x,y-size);g.lineTo(x+size*.24,y);
      }
      g.fill();
    }
    return tile;
  }
  function galaxy(){
    const rand=Fireworks.random(2186);
    // A tilted band of distant stars with two irregular arms and a central dust lane.
    return Array.from({length:2300},()=>{
      const az=(rand()-.5)*3.8;
      const side=rand()<.5?-1:1;
      const elevation=.48+.43*Math.sin(az*1.52+.85)+side*(.018+.17*(rand()+rand()+rand())/3)+.045*Math.sin(8*az);
      const r=Math.cos(elevation);
      return [r*Math.sin(az),Math.sin(elevation),-r*Math.cos(az),.24+rand()*.65,rand()*6.28];
    });
  }
  return {scenes,resolve,terrain,galaxy};
})();
