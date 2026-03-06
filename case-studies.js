(() => {
  const chips = document.querySelectorAll("[data-case-filter]");
  const cards = document.querySelectorAll("[data-case-sector]");

  if (!chips.length || !cards.length) {
    return;
  }

  const applyFilter = (target) => {
    chips.forEach((chip) => {
      const isActive = chip.getAttribute("data-case-filter") === target;
      chip.classList.toggle("is-active", isActive);
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    cards.forEach((card) => {
      const sector = card.getAttribute("data-case-sector");
      const show = target === "all" || sector === target;
      card.hidden = !show;
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const target = chip.getAttribute("data-case-filter") || "all";
      applyFilter(target);
    });
  });
})();
