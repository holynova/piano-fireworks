// Each proposal rearranges the same live inputs. The player remains their source of truth.
(() => {
  const modes={quick:'常用面板',guide:'按任务调',compare:'对照调台'};
  let mode=new URLSearchParams(location.search).get('panel');
  const trial=Object.hasOwn(modes,mode);
  if(!trial)mode='quick';
  const $=id=>document.getElementById(id);
  function el(tag,cls,text){
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text)n.textContent=text;
    return n;
  }
  function button(text,fn){
    const b=el('button','',text);
    b.type='button';b.onclick=fn;return b;
  }
  const groups=[
    ['夜空与机位',['backdrop','view','camera']],
    ['风与升空',['windDirection','windSpeed','launch','height']],
    ['烟花外观',['palette','brightness','shapes','overlap','attack','decay']],
    ['音画同步',['trigger','offset']],
    ['乐句与齐放',['staging','salvos','finale']]
  ];
  const tasks=[
    ['看清快段',['overlap','brightness','decay','shapes','palette']],
    ['听准爆点',['trigger','offset','attack']],
    ['换个视角',['backdrop','view','camera','launch','height','windDirection','windSpeed']],
    ['安排齐放',['staging','salvos','finale']]
  ];
  const presets=['brightness','backdrop','palette'];
  const colors={gold:'#dfab63',classic:'linear-gradient(90deg,#ddad66 33%,#b94b43 33% 66%,#75a07c 66%)',silver:'#c8cbd2',red:'#c35d56',green:'#80ae85',ice:'#6085c0',duo:'linear-gradient(90deg,#dfab63 50%,#c8cbd2 50%)',all:'linear-gradient(90deg,#c7675e,#c5ab67,#85b3ad,#8c7bac)'};
  const directionOrder=['135','90','45','180','center','0','225','270','315'];
  const shortWind={'135':'左远','90':'远岸','45':'右远','180':'左岸','0':'右岸','225':'左近','270':'近岸','315':'右近'};
  const arrows={'135':'↖','90':'↑','45':'↗','180':'←','0':'→','225':'↙','270':'↓','315':'↘'};
  function mount(){
    const root=$('tuning'),body=el('div','adjustBody');
    document.body.classList.add('previewPanels');
    const field={},titles={},picks=[],ranges=[];
    const depot=el('div');depot.hidden=true;root.append(depot);
    const slots=root.querySelector('.slots'),loop=$('loop');
    function wrap(id,title,...nodes){
      titles[id]=title;
      const box=el('div','adjustField');
      box.dataset.field=id;
      box.append(...nodes);depot.append(box);field[id]=box;
      return box;
    }
    for(const select of [...root.querySelectorAll('select')]){
      const id=select.id,old=select.closest('label'),title=old.firstChild.textContent.trim();
      const legend=el('legend','fieldTitle',title),set=el('fieldset','chipSet');
      set.append(legend);
      const row=el('div',id==='windDirection'?'windPad':'choiceRow');
      const options=[...select.options];
      const order=id==='windDirection'?directionOrder:options.map(o=>o.value);
      for(const value of order){
        if(value==='center'){row.append(el('span','windCenter','风'));continue}
        const opt=options.find(o=>o.value===value);
        const chip=el('label','optionChip'),radio=el('input');
        radio.type='radio';radio.name='preview-'+id;radio.value=value;
        const caption=el('span','chipName',shortWind[value] && id==='windDirection'?shortWind[value]:opt.textContent.split(' · ')[0]);
        if(id==='windDirection')chip.append(el('span','arrow',arrows[value]));
        if(id==='palette'){
          const swatch=el('span','swatch');
          swatch.style.background=colors[value];chip.append(swatch);
        }
        radio.setAttribute('aria-label',opt.textContent);
        radio.onchange=()=>{if(radio.checked){select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}))}};
        chip.append(radio,caption);row.append(chip);picks.push({select,radio});
      }
      set.append(row);select.hidden=true;wrap(id,title,set,select);old.remove();
    }
    for(const input of [...root.querySelectorAll('input.mixRange')]){
      const label=root.querySelector('label[for="'+input.id+'"]');
      const title=label.firstChild.textContent.trim();
      const rail=el('div','blockRail');rail.append(input);ranges.push(input);
      wrap(input.id,title,label,rail);
    }
    // These fields may already live in detached containers after the first pass.
    field.view.append($('tourOptions'));
    $('tourOptions').append(field.shotTime);
    field.trigger.append($('coverage'));
    field.staging.append(root.querySelector('.sectionCue'),$('sectionHint'));
    field.overlap.append($('overlapHint'));field.height.append($('heightHint'));
    field.salvos.append($('salvoCues'));
    for(const id of ['launch','finale']){
      const label=$(id).closest('label');label.classList.add('checkField');
      wrap(id,label.textContent.trim(),label);
    }
    $('endingOptions').prepend(field.ending);field.finale.append($('endingOptions'));
    wrap('shapes','烟花花型',root.querySelector('.shapePicker'));
    const switcher=el('nav','proposalSwitch');
    switcher.setAttribute('aria-label','调校面板方案');
    const heading=el('div','proposalHeading');
    heading.append(el('h3','','调校面板试用'));
    const back=el('a','','返回常规面板');back.href='index.html';heading.append(back);
    const tools=el('div','testTools');tools.append(slots,loop);
    root.replaceChildren(...(trial?[heading,switcher]:[]),body,depot);
    let activeTask=0,selected='brightness',snapshot,currentSlot;
    const work=el('div','panelContent');
    function place(container,ids){for(const id of ids)container.append(field[id])}
    function group(title,ids){
      const d=el('details','adjustGroup'),summary=el('summary','',title);
      d.append(summary);place(d,ids);return d;
    }
    function showQuick(){
      place(work,presets);
      const details=el('div','allGroups');
      for(const [name,ids] of groups)details.append(group(name,ids.filter(id=>!presets.includes(id))));
      work.append(details,tools);
    }
    function showGuide(){
      const tabs=el('div','taskMenu'),pane=el('div','taskPane');
      function selectTask(i){
        activeTask=i;
        [...tabs.children].forEach((b,j)=>b.setAttribute('aria-pressed',j===i));
        depot.append(...pane.children);
        place(pane,tasks[i][1]);
      }
      tasks.forEach(([name],i)=>tabs.append(button(name,()=>selectTask(i))));
      work.append(tabs,tools,pane);selectTask(activeTask);
    }
    const compareIds=['brightness','overlap','offset','windSpeed','decay','height','attack'];
    const suffix={brightness:'%',overlap:'%',offset:' ms',windSpeed:' m/s',decay:' 秒',height:'%',attack:'%'};
    const cells=[];
    function showCompare(){
      const table=el('table','compareTable'),head=table.createTHead().insertRow();
      for(const title of ['参数','方案 A','方案 B'])head.append(el('th','',title));
      const tbody=table.createTBody(),editor=el('div','compareEditor');
      function edit(id){
        selected=id;
        depot.append(...editor.children);editor.append(field[id]);
        for(const cell of cells)cell.b.setAttribute('aria-pressed',cell.id===id);
      }
      for(const id of compareIds){
        const r=tbody.insertRow(),b=button(titles[id],()=>edit(id));
        const name=document.createElement('th');name.scope='row';name.append(b);r.append(name);
        const a=r.insertCell(),other=r.insertCell();cells.push({id,a,other,b});
      }
      work.append(tools,table,editor);edit(selected);
      for(const [name,ids] of groups){
        const rest=ids.filter(id=>!compareIds.includes(id));
        if(rest.length)work.append(group(name,rest));
      }
    }
    function render(){
      for(const [,ids] of groups)place(depot,ids);
      depot.append(tools);cells.length=0;work.replaceChildren();body.replaceChildren(work);
      for(const b of switcher.children)b.setAttribute('aria-pressed',b.dataset.mode===mode);
      if(mode==='quick')showQuick();else if(mode==='guide')showGuide();else showCompare();
      if(snapshot)sync(snapshot,currentSlot);
    }
    for(const [key,name] of Object.entries(modes)){
      const b=button(name,()=>{
        if(mode===key)return;
        mode=key;render();
      });b.dataset.mode=key;switcher.append(b);
    }
    function sync(configs,slot){
      snapshot=configs;currentSlot=slot;
      for(const {select,radio} of picks)radio.checked=select.value===radio.value;
      for(const r of ranges){
        r.parentElement.style.setProperty('--fill',100*(r.value-r.min)/(r.max-r.min)+'%');
        const out=field[r.id].querySelector('output');
        if(out)r.setAttribute('aria-valuetext',out.textContent);
      }
      for(const {id,a,other} of cells){
        a.textContent=configs.A[id]+suffix[id];other.textContent=configs.B[id]+suffix[id];
        a.classList.toggle('editing',slot==='A');other.classList.toggle('editing',slot==='B');
      }
    }
    render();return {sync};
  }
  window.TuningPreview={mount,trial};
})();
