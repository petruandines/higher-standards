const toggle = document.querySelector('.menu-toggle');
const navWrap = document.querySelector('.nav-wrap');
const links = document.querySelectorAll('.nav a, .header-cta');

if (toggle && navWrap) {
  const closeMenu = () => {
    navWrap.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
  };

  toggle.addEventListener('click', () => {
    const open = navWrap.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('menu-open', open && window.innerWidth <= 900);
  });

  links.forEach(link => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

  revealItems.forEach(el => observer.observe(el));
} else {
  revealItems.forEach(el => el.classList.add('show'));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const quoteForm = document.getElementById('quote-form');
if (quoteForm) {
  quoteForm.addEventListener('submit', event => {
    event.preventDefault();

    const name = document.getElementById('q-name')?.value.trim() || '';
    const aircraft = document.getElementById('q-aircraft')?.value.trim() || '';
    const location = document.getElementById('q-location')?.value.trim() || '';
    const date = document.getElementById('q-date')?.value || '';
    const service = document.getElementById('q-service')?.value || '';
    const notes = document.getElementById('q-notes')?.value.trim() || '';

    const lines = [
      'Hello Petru & Inés – Higher Standards,',
      '',
      'I would like to request aircraft care.',
      '',
      `Name: ${name}`,
      `Aircraft: ${aircraft}`,
      `Location / aerodrome: ${location}`,
      `Service: ${service}`,
      `Preferred date: ${date || 'Flexible / to discuss'}`,
      `Notes: ${notes || 'None'}`,
      '',
      'I can send photos here if useful.'
    ];

    const message = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/40772053562?text=${message}`, '_blank', 'noopener');
  });
}
