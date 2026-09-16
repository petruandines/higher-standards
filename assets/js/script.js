const toggle=document.querySelector('.menu-toggle');
const navWrap=document.querySelector('.nav-wrap');
const links=document.querySelectorAll('.nav a');
if(toggle&&navWrap){
  toggle.addEventListener('click',()=>{
    const open=navWrap.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });
  links.forEach(link=>link.addEventListener('click',()=>{
    navWrap.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  }));
  window.addEventListener('resize',()=>{
    if(window.innerWidth>850){
      navWrap.classList.remove('open');
      toggle.setAttribute('aria-expanded','false');
    }
  });
}
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.14,rootMargin:'0px 0px -28px 0px'});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));