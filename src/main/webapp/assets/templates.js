(() => {
  const track = document.getElementById('templates-track');
  if (!track) return;
  const viewport = track.parentElement;
  const context = document.querySelector('link[href*="/assets/styles.css"]').getAttribute('href').replace(/\/assets\/styles\.css(?:\?.*)?$/, '');
  const menu = document.getElementById('menu-toggle');
  if (menu) {
    menu.addEventListener('click', () => document.querySelector('.main-nav').classList.toggle('open'));
    document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => document.querySelector('.main-nav').classList.remove('open')));
  }
  const scrollByCard = direction => viewport.scrollBy({ left: direction * Math.min(viewport.clientWidth * .82, 680), behavior: 'smooth' });
  document.getElementById('templates-prev').addEventListener('click', () => scrollByCard(-1));
  document.getElementById('templates-next').addEventListener('click', () => scrollByCard(1));
  viewport.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }
  }, { passive: false });
  track.addEventListener('click', event => {
    const choose = event.target.closest('[data-template]');
    if (!choose) return;
    const template = choose.getAttribute('data-template');
    if (!/^(modern|executive|minimal|creative|graduate|classic)$/.test(template)) return;
    window.location.href = `${context}/builder.jsp?template=${encodeURIComponent(template)}`;
  });
})();
