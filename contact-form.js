(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const submitBtn = document.getElementById("submitBtn");
  const statusEl = document.getElementById("formStatus");
  const originalBtnLabel = submitBtn ? submitBtn.textContent : "Submit Enquiry";
  const fields = Array.from(form.elements).filter((field) => {
    return (
      field instanceof HTMLInputElement ||
      field instanceof HTMLSelectElement ||
      field instanceof HTMLTextAreaElement
    );
  });

  if (statusEl) {
    statusEl.setAttribute("tabindex", "-1");
  }

  function setStatus(message, type = "", focus = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("is-success", "is-error");
    if (type) statusEl.classList.add(type);
    if (focus) statusEl.focus();
  }

  function getErrorElement(field) {
    const wrapper = field.closest(".form-field");
    if (!wrapper) return null;

    const errorId = `contact-error-${field.name}`;
    let errorEl = wrapper.querySelector(".field-error");
    if (!errorEl) {
      errorEl = document.createElement("p");
      errorEl.className = "field-error";
      errorEl.id = errorId;
      wrapper.appendChild(errorEl);
    }
    return errorEl;
  }

  function clearFieldError(field) {
    const errorEl = getErrorElement(field);
    if (errorEl) {
      errorEl.textContent = "";
    }

    field.removeAttribute("aria-invalid");

    const describedBy = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean)
      .filter((token) => token !== `contact-error-${field.name}`);
    if (describedBy.length) {
      field.setAttribute("aria-describedby", describedBy.join(" "));
    } else {
      field.removeAttribute("aria-describedby");
    }
  }

  function showFieldError(field, message) {
    const errorEl = getErrorElement(field);
    if (!errorEl) return;

    errorEl.textContent = message;
    field.setAttribute("aria-invalid", "true");

    const token = `contact-error-${field.name}`;
    const describedBy = (field.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter(Boolean);
    if (!describedBy.includes(token)) {
      describedBy.push(token);
      field.setAttribute("aria-describedby", describedBy.join(" "));
    }
  }

  function validateForm() {
    let firstInvalidField = null;

    fields.forEach((field) => {
      clearFieldError(field);
      if (!field.willValidate) return;
      if (field.checkValidity()) return;

      showFieldError(field, field.validationMessage);
      if (!firstInvalidField) {
        firstInvalidField = field;
      }
    });

    if (firstInvalidField) {
      firstInvalidField.focus();
      setStatus("Please review the highlighted fields and try again.", "is-error", true);
      return false;
    }

    return true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }
    setStatus("Submitting your enquiry...");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.message || "Unable to send enquiry.");
      }

      form.reset();
      fields.forEach((field) => clearFieldError(field));
      setStatus("Enquiry submitted successfully. Our team will contact you shortly.", "is-success");
    } catch (error) {
      setStatus(error.message || "Unable to submit enquiry. Please try again shortly.", "is-error", true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnLabel;
      }
    }
  });
})();
