(() => {
  const html = document.documentElement;
  const body = document.body;
  const switches = document.querySelectorAll("[data-lang-switch]");
  const yearEl = document.getElementById("copyrightYear");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const url = new URL(window.location.href);
  const requested = url.searchParams.get("lang");
  const stored = localStorage.getItem("site_lang");
  const lang = requested || stored || "en";

  const applyLanguageMode = (mode) => {
    if (mode === "ar") {
      html.lang = "ar";
      html.dir = "rtl";
      body.classList.add("rtl");
    } else {
      html.lang = "en-GB";
      html.dir = "ltr";
      body.classList.remove("rtl");
    }
  };

  applyLanguageMode(lang);
  localStorage.setItem("site_lang", lang);

  switches.forEach((link) => {
    const targetLang = link.getAttribute("data-lang-switch");
    const next = new URL(window.location.href);
    next.searchParams.set("lang", targetLang);
    link.setAttribute("href", next.pathname + next.search);
    if (targetLang === lang) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "true");
    }

    link.addEventListener("click", (event) => {
      event.preventDefault();
      const selected = link.getAttribute("data-lang-switch");
      const destination = new URL(window.location.href);
      destination.searchParams.set("lang", selected);
      localStorage.setItem("site_lang", selected);
      window.location.href = destination.pathname + destination.search;
    });
  });
})();
