(() => {
  const form = document.getElementById("applicationForm");
  if (!form) return;

  const submitBtn = document.getElementById("applicationSubmitBtn");
  const statusEl = document.getElementById("applicationStatus");
  const titleInput = document.getElementById("jobTitleInput");
  const codeInput = document.getElementById("jobCodeInput");
  const cvInput = form.querySelector('input[name="cv"]');
  const originalBtnLabel = submitBtn ? submitBtn.textContent : "Submit Application";
  const maxCvSizeBytes = 5 * 1024 * 1024;
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

    const errorId = `application-error-${field.name}`;
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
      .filter((token) => token !== `application-error-${field.name}`);
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

    const token = `application-error-${field.name}`;
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

    const file = cvInput && cvInput.files ? cvInput.files[0] : null;
    if (!file) {
      if (cvInput) {
        showFieldError(cvInput, "Please upload your CV.");
      }
      firstInvalidField = firstInvalidField || cvInput;
    } else {
      const fileName = file.name.toLowerCase();
      const hasAllowedExtension =
        fileName.endsWith(".pdf") || fileName.endsWith(".doc") || fileName.endsWith(".docx");

      if (!hasAllowedExtension) {
        showFieldError(cvInput, "Please upload a PDF or Word document (.pdf, .doc, .docx).");
        firstInvalidField = firstInvalidField || cvInput;
      } else if (file.size > maxCvSizeBytes) {
        showFieldError(cvInput, "CV file size must be 5MB or less.");
        firstInvalidField = firstInvalidField || cvInput;
      }
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
      setStatus("Please review the highlighted fields and try again.", "is-error", true);
      return false;
    }

    return true;
  }

  function restoreJobFields() {
    if (titleInput && form.dataset.jobTitle) {
      titleInput.value = form.dataset.jobTitle;
    }
    if (codeInput && form.dataset.jobCode) {
      codeInput.value = form.dataset.jobCode;
    }
  }

  restoreJobFields();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = new FormData(form);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";
    }
    setStatus("Submitting your application...");

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        body: payload,
      });

      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.message || "Unable to submit application.");
      }

      form.reset();
      fields.forEach((field) => clearFieldError(field));
      restoreJobFields();
      setStatus("Application submitted successfully. Our team will review your profile and respond shortly.", "is-success");
    } catch (error) {
      setStatus(error.message || "Unable to submit application. Please try again shortly.", "is-error", true);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnLabel;
      }
    }
  });
})();
