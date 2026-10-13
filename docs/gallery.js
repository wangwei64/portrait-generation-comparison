(() => {
 const filters=['cohort','category','framing'].map(id=>document.getElementById(id)),search=document.querySelector('#search'),cards=[...document.querySelectorAll('article')];
 function render(){let n=0;for(const card of cards){const visible=filters.every(f=>!f.value||card.dataset[f.id]===f.value)&&(!search.value||card.textContent.toLowerCase().includes(search.value.toLowerCase()));card.hidden=!visible;if(visible)n++;}document.querySelector('#count').textContent=n+' 组';document.querySelector('#empty').hidden=n>0;}
 filters.forEach(f=>f.addEventListener('input',render));search.addEventListener('input',render);
 document.querySelector('#pixel').addEventListener('change',event=>document.body.classList.toggle('pixel',event.target.checked));
 for(const card of cards){const frames=[...card.querySelectorAll('.frame')];for(const frame of frames)frame.addEventListener('scroll',()=>{if(!document.body.classList.contains('pixel'))return;for(const other of frames){if(other===frame)continue;if(Math.abs(other.scrollLeft-frame.scrollLeft)>1)other.scrollLeft=frame.scrollLeft;if(Math.abs(other.scrollTop-frame.scrollTop)>1)other.scrollTop=frame.scrollTop;}},{passive:true});}
 const update=document.querySelector('#update');update.addEventListener('click',()=>location.reload());
 setInterval(async()=>{try{const r=await fetch('summary.json',{cache:'no-store'});if(!r.ok)return;const s=await r.json();if(s.published_groups>window.publishedCount||s.server_generated_images>window.serverCount){update.hidden=false;update.textContent=`进度已更新：${s.published_groups} 组完整对照 · 点击刷新`;}}catch{}},30000);
 render();
})();
