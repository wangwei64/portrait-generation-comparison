// Inspect corresponding normalized coordinates without changing either source image.
(() => {
  const enabled = document.querySelector('#hover-zoom');
  const scale = document.querySelector('#zoom-scale');
  if (!enabled || !scale) return;
  const dock = document.createElement('aside');
  dock.className = 'zoom-dock'; dock.hidden = true;
  dock.setAttribute('aria-label', '四图同步局部放大');
  dock.innerHTML = '<div class="zoom-heading"><b>同步局部放大</b><span class="zoom-level"></span></div><div class="zoom-panels"><figure><figcaption>真实照片</figcaption><canvas></canvas></figure><figure><figcaption>Z-Image</figcaption><canvas></canvas></figure><figure><figcaption>Qwen-Image-2.1</figcaption><canvas></canvas></figure><figure><figcaption>Sana 600M</figcaption><canvas></canvas></figure></div><div class="zoom-coordinates"></div>';
  document.body.append(dock);
  const canvases = [...dock.querySelectorAll('canvas')];
  const frames = [...document.querySelectorAll('article .pair .frame')];
  let active = null, point = {x:.5,y:.5}, request = 0;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const allowed = () => enabled.checked && !document.body.classList.contains('pixel');

  function contentRect(img) {
    const rect = img.getBoundingClientRect();
    const factor = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const width = img.naturalWidth * factor, height = img.naturalHeight * factor;
    return {left:rect.left + (rect.width-width)/2, top:rect.top + (rect.height-height)/2,width,height};
  }
  function hide() {
    active = null; dock.hidden = true;
    document.querySelectorAll('.zoom-marker').forEach(marker => marker.hidden = true);
  }
  function draw() {
    request = 0;
    if (!active || !allowed()) { hide(); return; }
    const pair = [...active.closest('.pair').querySelectorAll('.frame')];
    const images = pair.map(frame => frame.querySelector('img'));
    if (images.length !== 4 || images.some(img => !img.complete || !img.naturalWidth)) {hide(); return;}
    dock.hidden = false;
    const zoom = Number(scale.value), size = canvases[0].getBoundingClientRect().width;
    if (!size) return;
    const crop = Math.min(size/zoom, ...images.flatMap(img => [img.naturalWidth,img.naturalHeight]));
    // Dimensions are matched by preparation; clamp a full crop inside both edges.
    const x = clamp(point.x * images[0].naturalWidth - crop/2, 0, images[0].naturalWidth-crop);
    const y = clamp(point.y * images[0].naturalHeight - crop/2, 0, images[0].naturalHeight-crop);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    images.forEach((img,index) => {
      const canvas = canvases[index], pixels = Math.round(size*dpr);
      if (canvas.width !== pixels) {canvas.width=pixels;canvas.height=pixels;}
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0,0,pixels,pixels);
      ctx.imageSmoothingEnabled = zoom < 2;
      ctx.drawImage(img,x,y,crop,crop,0,0,pixels,pixels);
      const rect = contentRect(img), box = pair[index].getBoundingClientRect();
      const marker = pair[index].querySelector('.zoom-marker');
      marker.hidden = false;
      Object.assign(marker.style,{left:`${rect.left-box.left+x/img.naturalWidth*rect.width}px`,top:`${rect.top-box.top+y/img.naturalHeight*rect.height}px`,width:`${crop/img.naturalWidth*rect.width}px`,height:`${crop/img.naturalHeight*rect.height}px`});
    });
    dock.dataset.imageId = active.closest('article').dataset.id;
    dock.dataset.sourceX = x.toFixed(2); dock.dataset.sourceY = y.toFixed(2);
    dock.dataset.sourceSize = crop.toFixed(2);
    dock.querySelector('.zoom-level').textContent = `${Math.round(zoom*100)}% 原始像素 · Esc 关闭`;
    dock.querySelector('.zoom-coordinates').textContent = `${dock.dataset.imageId} · x ${Math.round(x)}–${Math.round(x+crop)} / y ${Math.round(y)}–${Math.round(y+crop)}`;
  }
  function schedule() {if(!request) request=requestAnimationFrame(draw);}
  function setPoint(frame,event) {
    if (!allowed()) return hide();
    const img=frame.querySelector('img'); if(!img.naturalWidth) return hide();
    const rect=contentRect(img), x=(event.clientX-rect.left)/rect.width, y=(event.clientY-rect.top)/rect.height;
    if(x<0||x>1||y<0||y>1) return hide();
    if(active !== frame) document.querySelectorAll('.zoom-marker').forEach(marker => marker.hidden=true);
    active=frame;point={x,y};schedule();
  }
  frames.forEach(frame => {
    const marker=document.createElement('div');marker.className='zoom-marker';marker.hidden=true;marker.setAttribute('aria-hidden','true');frame.append(marker);
    frame.tabIndex=0;frame.setAttribute('role','group');
    frame.setAttribute('aria-label', `${frame.querySelector('img').alt}，悬停或聚焦放大，方向键移动，Escape 关闭`);
    frame.addEventListener('pointermove',event=>setPoint(frame,event),{passive:true});
    frame.addEventListener('pointerdown',event=>setPoint(frame,event),{passive:true});
    frame.addEventListener('pointerleave',hide);
    frame.addEventListener('focus',()=>{if(allowed()){active=frame;point={x:.5,y:.5};schedule();}});
    frame.addEventListener('blur',hide);
    frame.addEventListener('keydown',event=>{
      const directions={ArrowLeft:[-.02,0],ArrowRight:[.02,0],ArrowUp:[0,-.02],ArrowDown:[0,.02]};
      if(event.key==='Escape'){hide();return;}
      if(!directions[event.key]||!allowed())return;
      event.preventDefault();active=frame;
      point={x:clamp(point.x+directions[event.key][0],0,1),y:clamp(point.y+directions[event.key][1],0,1)};schedule();
    });
  });
  enabled.addEventListener('change',()=>{document.body.classList.toggle('zoom-enabled',enabled.checked);hide();});
  scale.addEventListener('change',schedule);
  document.querySelector('#pixel')?.addEventListener('change',hide);
  document.querySelector('#category')?.addEventListener('input',hide);
  document.querySelector('#search')?.addEventListener('input',hide);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
  window.addEventListener('scroll',hide,{passive:true});
  window.addEventListener('resize',hide,{passive:true});
  document.body.classList.toggle('zoom-enabled',enabled.checked);
})();
