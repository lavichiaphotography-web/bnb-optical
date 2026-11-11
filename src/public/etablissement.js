const visual=document.querySelector('.visual');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(visual&&!reduce){
  const update=()=>{const y=Math.min(scrollY/innerHeight,1);visual.style.setProperty('--sy',`${y*-18}px`);visual.style.setProperty('--rx',`${y*3.5}deg`)};
  addEventListener('scroll',update,{passive:true});update();
  visual.addEventListener('pointermove',e=>{const r=visual.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;visual.style.setProperty('--ry',`${x*5}deg`);visual.style.setProperty('--rx',`${y*-4}deg`)});
  visual.addEventListener('pointerleave',()=>{visual.style.setProperty('--ry','0deg');update()});
}
const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('in',e.isIntersecting)),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
const progress=document.querySelector('.reading-progress');
if(progress){
  const updateProgress=()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.setProperty('--progress',`${max>0?Math.min(100,scrollY/max*100):0}%`)};
  addEventListener('scroll',updateProgress,{passive:true});updateProgress();
}
