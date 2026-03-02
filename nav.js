(() => {
  document.documentElement.classList.add('js-nav');
  const mobileBreakpoint = 960;
  const topbars = document.querySelectorAll('.topbar');

  topbars.forEach((topbar) => {
    const toggle = topbar.querySelector('.nav-toggle');
    const nav = topbar.querySelector('.nav');
    if (!toggle || !nav) return;

    const closeMenu = () => {
      topbar.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      topbar.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
      if (topbar.classList.contains('nav-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= mobileBreakpoint) closeMenu();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > mobileBreakpoint) closeMenu();
    });

    document.addEventListener('click', (event) => {
      if (window.innerWidth > mobileBreakpoint) return;
      if (!topbar.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  });
})();
