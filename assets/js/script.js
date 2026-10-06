'use strict';
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-wrap');
  const desktop = window.matchMedia('(min-width: 1100px)');
  const setMenu = (open, restoreFocus = false) => {
    menu?.classList.toggle('open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (restoreFocus) toggle?.focus();
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (event.target instanceof Node && !menu?.contains(event.target) && !toggle?.contains(event.target)) setMenu(false);
  });
  document.addEventListener('focusin', event => {
    if (!desktop.matches && event.target instanceof Node && !menu?.contains(event.target) && !toggle?.contains(event.target)) setMenu(false);
  });
  desktop.addEventListener('change', () => setMenu(false));

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Keep the legal policy easy to find without changing the visual hierarchy of the landing page.
  const footerProvider = document.querySelector('.footer-bottom p:last-child');
  if (footerProvider && !footerProvider.querySelector('a[href="/legal/"]')) {
    footerProvider.append(document.createTextNode(' · '));
    const legalLink = document.createElement('a');
    legalLink.href = '/legal/';
    legalLink.textContent = 'Legal & Service Policy';
    footerProvider.append(legalLink);
  }

  const formNote = document.querySelector('.form-note');
  if (formNote && !formNote.querySelector('a[href="/legal/"]')) {
    formNote.append(document.createTextNode(' Read our '));
    const legalLink = document.createElement('a');
    legalLink.href = '/legal/';
    legalLink.textContent = 'Legal & Service Policy';
    formNote.append(legalLink, document.createTextNode('.'));
  }

  const form = document.getElementById('quote-form');
  if (!form) return;
  const service = document.getElementById('q-service');
  document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', () => {
    if (service) service.value = link.dataset.service;
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    // Native validation covers required fields; also reject whitespace-only entries.
    for (const name of ['name', 'aircraft', 'location']) {
      const input = form.elements.namedItem(name);
      input.value = input.value.trim();
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const lines = [
      'Hello Petru & Inés – Higher Standards,', '', 'I would like to request aircraft care.', '',
      `Name: ${value('name')}`, `Aircraft: ${value('aircraft')}`, `Location / aerodrome: ${value('location')}`,
      `Service: ${value('service')}`, `Preferred date: ${value('date') || 'Flexible / to discuss'}`,
      `Notes: ${value('notes') || 'None'}`
    ];
    const url = `https://wa.me/40772053562?text=${encodeURIComponent(lines.join('\n'))}`;
    const status = document.getElementById('form-status');
    // Keep a visible fallback when the browser blocks new tabs.
    const fallback = document.createElement('a');
    fallback.href = url;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    fallback.textContent = 'Open your prepared request in WhatsApp';
    status?.replaceChildren(fallback);
    window.open(url, '_blank', 'noopener,noreferrer');
  });
})();
