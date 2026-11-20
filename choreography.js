// Cue points are quarter-note beats in the unfolded performances in music/build.py.
window.Choreography = (() => {
  const names={melody:'循音散点', banks:'两岸对答', wave:'横向波浪', fan:'渐开扇面'};
  const descriptions={
    melody:'低音偏左下，高音偏右上，强音的花朵更大。',
    banks:'中央 C 以下在左岸回应，中央 C 及以上在右岸绽放。',
    wave:'爆点随乐拍横移，高音让波浪上的花朵升得更高。',
    fan:'同一音区沿相近的方向绽放，扇面在本段前六拍逐渐展开。'
  };
  const scores={
    debussy_arabesque:[[0,'wave'],[64,'banks'],[144,'melody'],[256,'fan'],[336,'wave']],
    raindrop:[[0,'melody'],[64,'banks'],[112,'wave'],[224,'fan'],[304,'melody']],
    mountain_king:[[0,'banks'],[64,'wave'],[128,'banks'],[224,'fan'],[288,'wave']],
    consolation:[[0,'melody'],[48,'wave'],[112,'fan'],[176,'melody']],
    gondola:[[0,'wave'],[48,'banks'],[96,'melody'],[132,'wave']],
    bells:[[0,'banks'],[64,'wave'],[112,'fan'],[176,'banks'],[224,'melody']],
    schubert_impromptu:[[0,'wave'],[128,'melody'],[256,'banks'],[416,'fan'],[544,'wave']],
    gnossienne:[[0,'melody'],[80,'banks'],[160,'wave'],[240,'melody']],
    carmen:[[0,'fan'],[64,'banks'],[128,'wave'],[192,'fan'],[256,'melody']],
    minuet_g:[[0,'melody'],[24,'banks'],[48,'fan'],[72,'melody']],
    moonlight:[[0,'melody'],[36,'banks'],[92,'wave'],[168,'melody'],[240,'fan']],
    nocturne:[[0,'melody'],[48,'fan'],[96,'banks'],[144,'wave'],[192,'melody']],
    facile:[[0,'fan'],[56,'wave'],[112,'banks'],[168,'melody'],[232,'fan']],
    kinderszenen:[[0,'melody'],[16,'banks'],[32,'melody']],
    minute:[[0,'wave'],[96,'fan'],[192,'melody'],[288,'wave'],[384,'fan']],
    pathetique:[[0,'melody'],[32,'banks'],[64,'wave'],[96,'banks'],[128,'melody']],
    invention:[[0,'banks'],[24,'wave'],[48,'banks'],[72,'fan']],
    fantaisie:[[0,'wave'],[80,'banks'],[160,'melody'],[232,'fan'],[328,'wave'],[472,'banks'],[540,'melody']],
    eminor:[[0,'melody'],[32,'banks'],[64,'fan'],[84,'melody']],
    maple:[[0,'banks'],[64,'fan'],[128,'wave'],[192,'banks'],[256,'fan']],
    greensleeves:[[0,'melody'],[25,'banks'],[49,'wave'],[73,'melody']],
    cello:[[0,'wave'],[32,'melody'],[64,'banks'],[88,'fan'],[124,'wave'],[152,'fan']],
    entertainer:[[0,'melody'],[8,'banks'],[40,'wave'],[72,'fan'],[104,'banks'],
                 [136,'wave'],[168,'melody'],[200,'fan'],[232,'banks'],[264,'fan']],
    turca:[[0,'melody'],[16,'banks'],[32,'wave'],[96,'fan'],[128,'banks'],[160,'wave'],
           [224,'fan'],[256,'melody'],[288,'banks'],[352,'fan'],[383,'wave'],[415,'fan']],
    elise:[[0,'melody'],[12,'banks'],[23,'wave'],[45.5,'melody'],[65,'wave'],[86,'fan'],
           [98,'melody'],[125,'banks'],[149,'fan'],[158,'melody']],
    gymnopedie:[[0,'banks'],[12,'melody'],[36,'wave'],[63,'fan'],[93,'melody'],
                [117,'banks'],[129,'melody'],[153,'wave'],[180,'fan'],[210,'melody']],
    prayer:[[0,'fan'],[16,'melody'],[48,'banks'],[80,'wave'],[112,'melody'],[144,'fan'],
            [176,'wave'],[208,'banks'],[224,'fan']],
    clair:[[0,'melody'],[35.5,'banks'],[62.5,'melody'],[116.5,'wave'],[161.5,'fan'],
           [188.5,'wave'],[224.5,'melody'],[292,'banks']],
    prelude:[[0,'melody'],[16,'banks'],[40,'wave'],[76,'fan'],[96,'wave'],[128,'melody']],
    original:[[0,'melody'],[8,'banks'],[16,'wave'],[20,'fan'],[26.5,'melody']]
  };
  // The third field marks extra phrase accents for the denser arrangement.
  const salvoScores={
    debussy_arabesque:[[64,'trio',true],[256,'arch']],
    raindrop:[[64,'arch',true],[224,'fan']],
    mountain_king:[[64,'fan',true],[224,'trio']],
    consolation:[[48,'trio',true],[176,'arch']],
    gondola:[[48,'arch',true],[132,'fan']],
    bells:[[64,'fan',true],[176,'trio']],
    schubert_impromptu:[[128,'trio',true],[416,'arch']],
    gnossienne:[[80,'arch',true],[240,'fan']],
    carmen:[[64,'fan',true],[192,'trio']],
    minuet_g:[[24,'trio',true],[72,'arch']],
    moonlight:[[92,'trio',true],[168,'arch']],
    nocturne:[[96,'trio'],[192,'arch',true]],
    facile:[[56,'trio',true],[112,'arch'],[232,'fan']],
    kinderszenen:[[16,'trio'],[32,'arch',true]],
    minute:[[96,'fan'],[192,'arch',true],[384,'fan']],
    pathetique:[[64,'trio'],[128,'arch',true]],
    invention:[[24,'trio',true],[72,'fan']],
    fantaisie:[[80,'trio',true],[160,'arch'],[328,'fan'],[472,'trio',true]],
    eminor:[[32,'trio',true],[64,'arch']],
    maple:[[64,'arch'],[128,'trio',true],[256,'fan']],
    greensleeves:[[25,'trio',true],[49,'arch'],[73,'trio',true]],
    cello:[[32,'trio',true],[64,'arch'],[88,'trio',true],[124,'fan']],
    entertainer:[[40,'trio',true],[72,'fan'],[136,'arch',true],[168,'trio'],[232,'fan']],
    turca:[[32,'arch',true],[96,'fan'],[224,'arch'],[288,'trio',true],[383,'fan']],
    elise:[[23,'trio',true],[45.5,'arch'],[98,'trio',true],[125,'fan']],
    gymnopedie:[[36,'arch',true],[63,'trio'],[117,'trio',true],[180,'arch']],
    original:[[12,'trio']],
    prayer:[[48,'trio'],[80,'arch',true],[144,'fan'],[176,'trio',true],[208,'arch']],
    clair:[[62.5,'trio',true],[116.5,'arch'],[161.5,'fan'],[188.5,'arch',true],[224.5,'trio']],
    prelude:[[16,'trio',true],[40,'arch'],[76,'trio',true],[96,'fan']]
  };
  const salvoNames={trio:'三点呼应',arch:'五点拱桥',fan:'七点折扇'};
  function salvoPoints(form){
    if(form==='fan'){
      const points=[[0,9.3,-15,1.15]];
      for(const side of [-1,1]){
        points.push([side*2.4,12.8,-15.5,1],[side*6.8,15,-16,1.05],[side*2.2,17.4,-16,1.05]);
      }
      return points;
    }
    const count=form==='trio'?3:5;
    return Array.from({length:count},(_,i)=>{
      const u=2*i/(count-1)-1;
      const center=1-u*u;
      return [u*6.8,12.4+center*(form==='trio'?2.5:4.1),-16-center,1+.20*center];
    });
  }
  const endings={
    ring:{name:'双层花环',detail:'34 发同拍绽放，18 发围成外圈，12 发围成内圈，4 发点亮花心。'},
    fan:{name:'扇面齐放',detail:'三层烟花沿七条射线同时展开，像一把张开的折扇。'},
    arc:{name:'弦月',detail:'13 朵小烟花沿一弯斜月同时亮起，两端逐渐变细。'}
  };
  // Each map entry gives elapsed score beats, audio seconds and local quarter-note BPM.
  function tempoSegment(track,column,value){
    const map=track.beatMap;
    if(!map)return [0,track.notes[0]?.[0]||0,track.tempo];
    let lo=0,hi=map.length;
    while(lo+1<hi){
      const mid=(lo+hi)>>1;
      if(map[mid][column]<=value)lo=mid;else hi=mid;
    }
    return map[lo];
  }
  function beatAt(track,t){
    const [b,sec,bpm]=tempoSegment(track,1,t);
    return b+(t-sec)*bpm/60;
  }
  function phraseAttacks(track,plan){
    const result=[];
    let cursor=0;
    for(const [beat,form] of plan){
      const [b,sec,bpm]=tempoSegment(track,0,beat);
      const target=sec+(beat-b)*60/bpm;
      while(cursor<track.notes.length&&track.notes[cursor][0]<target-.0001)cursor++;
      if(cursor<track.notes.length)result.push({start:track.notes[cursor][0],form});
    }
    return result;
  }
  function salvos(track,mode){
    if(mode==='off')return [];
    const plan=(salvoScores[track.id]||[]).filter(([, ,extra])=>mode==='more'||!extra);
    return phraseAttacks(track,plan).map(({start,form})=>({t:start,form,lead:0}));
  }
  function sections(track,mode){
    if(mode==='fixed')return [{start:0,form:'melody'}];
    const result=phraseAttacks(track,scores[track.id]||[[0,'melody']]);
    return result.length?result:[{start:0,form:'melody'}];
  }
  function sectionAt(sections,t){
    let index=0;
    while(index+1<sections.length && sections[index+1].start<=t)index++;
    return index;
  }
  function position(form,t,beat,pitch,spread){
    const lane=Math.tanh((pitch-63)/20);
    switch(form){
      case 'banks': {
        const side=pitch<60?-1:1;
        return [side*(4.1+2.6*Math.abs(lane))+spread*.5,9.8+lane*3.5+Math.sin(beat*.8)*.45,
          -16+side*1.8];
      }
      case 'wave': {
        const phase=beat*Math.PI/8;
        return [7.4*Math.sin(phase)+lane*1.9+spread*.4,10.4+2.2*Math.cos(phase)+lane*3,
          -16+2.1*Math.sin(phase)];
      }
      case 'fan': {
        const angle=lane*1.03+spread*.13;
        const length=3.5+4.3*Math.min(1,beat/6)+lane*1.5;
        return [Math.sin(angle)*length*1.35,5.6+Math.cos(angle)*length+lane*2.6,-14-Math.abs(lane)*3];
      }
      default:
        return [lane*6.4+Math.sin(t*2.1)*1.6+spread,9.8+lane*2.6+Math.sin(t*1.4+pitch*.55)*1.15,
          -15+2.1*Math.cos(pitch*.58+t*.65)];
    }
  }
  function endingFor(track,choice){
    return choice==='score'?({greensleeves:'arc',cello:'fan',entertainer:'ring',turca:'fan',gymnopedie:'arc',elise:'arc',clair:'arc',prayer:'ring',prelude:'fan'}[track.id]||'ring'):choice;
  }
  // All coordinates in a formation share the chosen musical attack.
  function endingPoints(form){
    const points=[];
    if(form==='fan'){
      for(let row=0;row<3;row++)for(let ray=-3;ray<=3;ray++){
        const a=ray*.32, r=4.0+row*2.6;
        points.push([Math.sin(a)*r,6.4+Math.cos(a)*r,-14-row*.65,.83+row*.14]);
      }
    }else if(form==='arc'){
      for(let i=0;i<13;i++){
        const u=i/12, a=(.12+.80*u)*Math.PI, size=.52+.60*Math.sin(Math.PI*u);
        points.push([8*Math.cos(a),12.4-4.4*Math.sin(a)+3.8*u,-15,size]);
      }
    }else{
      for(const [count,radius] of [[18,8.1],[12,5],[4,.88]])for(let i=0;i<count;i++){
        const a=i*2*Math.PI/count-Math.PI/2;
        points.push([Math.cos(a)*radius,13+Math.sin(a)*radius,-14,count===4?.93:1.12]);
      }
    }
    return points;
  }
  return {beatAt,tempoSegment,names,descriptions,endings,salvoNames,salvoPoints,salvos,sections,sectionAt,position,endingFor,endingPoints};
})();
