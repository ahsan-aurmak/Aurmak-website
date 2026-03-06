(() => {
  const html = document.documentElement;
  const body = document.body;
  const switches = document.querySelectorAll("[data-lang-switch]");
  const yearEl = document.getElementById("copyrightYear");
  const supportedLangs = new Set(["en"]);
  const defaultLang = "en";

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const main = document.querySelector("main");
  if (main) {
    if (!main.id) {
      main.id = "main-content";
    }
    if (!document.querySelector(".skip-link")) {
      const skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = `#${main.id}`;
      skip.textContent = "Skip to content";
      body.insertBefore(skip, body.firstChild);
    }
  }

  const url = new URL(window.location.href);
  const requested = url.searchParams.get("lang");
  const stored = localStorage.getItem("site_lang");
  const preferredLang = requested || stored || defaultLang;
  const lang = supportedLangs.has(preferredLang) ? preferredLang : defaultLang;

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
  if (preferredLang !== lang) {
    url.searchParams.set("lang", lang);
    if (lang === defaultLang) {
      url.searchParams.delete("lang");
    }
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  const announceLangStatus = (message) => {
    let region = document.getElementById("langStatus");
    if (!region) {
      region = document.createElement("p");
      region.id = "langStatus";
      region.className = "sr-only";
      region.setAttribute("aria-live", "polite");
      body.appendChild(region);
    }
    region.textContent = message;
  };

  switches.forEach((link) => {
    const targetLang = link.getAttribute("data-lang-switch");
    if (!targetLang) return;

    if (!supportedLangs.has(targetLang)) {
      link.classList.add("is-disabled");
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("title", "Arabic version coming soon");
      link.setAttribute("href", window.location.pathname + window.location.search);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        announceLangStatus("Arabic version coming soon.");
      });
      return;
    }

    const next = new URL(window.location.href);
    next.searchParams.set("lang", targetLang);
    if (targetLang === defaultLang) {
      next.searchParams.delete("lang");
    }
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
