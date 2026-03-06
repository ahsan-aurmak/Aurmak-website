(() => {
  const chips = document.querySelectorAll('[data-insight-filter]');
  const cards = document.querySelectorAll('[data-insight-topic]');

  if (!chips.length || !cards.length) return;

  const applyFilter = (filter) => {
    chips.forEach((chip) => {
      const isActive = chip.getAttribute('data-insight-filter') === filter;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    cards.forEach((card) => {
      const topic = card.getAttribute('data-insight-topic');
      const show = filter === 'all' || topic === filter;
      card.hidden = !show;
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const filter = chip.getAttribute('data-insight-filter') || 'all';
      applyFilter(filter);
    });
  });
})();
