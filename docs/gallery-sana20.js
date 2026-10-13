(() => {
  const byId=id=>document.getElementById(id);
  const filters=['cohort','category','framing'].map(byId),search=byId('search'),sort=byId('sort');
  const cards=[...document.querySelectorAll('article')],grid=document.querySelector('.grid');
  function render(){
    const [key,order]=sort.value.split(':');
    cards.sort((a,b)=>(Number(a.dataset[key])-Number(b.dataset[key]))*(order==='desc'?-1:1));
    let n=0;
    for(const card of cards){
      const text=(card.dataset.id+' '+card.querySelector('.prompt').textContent).toLowerCase();
      card.hidden=!(filters.every(f=>!f.value||card.dataset[f.id]===f.value)&&(!search.value.trim()||text.includes(search.value.trim().toLowerCase())));
      if(!card.hidden)n++;
      grid.append(card);
    }
    byId('count').textContent=n+'组';byId('empty').hidden=n>0;
  }
  [...filters,search,sort].forEach(f=>f.addEventListener('input',render));
  byId('pixel').addEventListener('change',event=>document.body.classList.toggle('pixel',event.target.checked));
  for(const card of cards){
    const frames=[...card.querySelectorAll('.pair .frame')];let syncing=false;
    for(const frame of frames)frame.addEventListener('scroll',()=>{
      if(!document.body.classList.contains('pixel')||syncing)return;
      syncing=true;
      const x=frame.scrollLeft/Math.max(1,frame.scrollWidth-frame.clientWidth),y=frame.scrollTop/Math.max(1,frame.scrollHeight-frame.clientHeight);
      for(const other of frames)if(other!==frame){other.scrollLeft=x*Math.max(0,other.scrollWidth-other.clientWidth);other.scrollTop=y*Math.max(0,other.scrollHeight-other.clientHeight);}
      requestAnimationFrame(()=>syncing=false);
    },{passive:true});
  }
  byId('update').addEventListener('click',()=>location.reload());
  setInterval(async()=>{try{const r=await fetch('summary.json',{cache:'no-store'});if(r.ok&&(await r.json()).completed_metrics>window.completedMetrics)byId('update').hidden=false;}catch{}},30000);
  render();
})();
