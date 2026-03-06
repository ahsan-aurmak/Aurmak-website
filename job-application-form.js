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

  function setStatus(message, type = "") {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove("is-success", "is-error");
    if (type) statusEl.classList.add(type);
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

    if (!form.reportValidity()) {
      return;
    }

    const file = cvInput && cvInput.files ? cvInput.files[0] : null;
    if (!file) {
      setStatus("Please upload your CV.", "is-error");
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasAllowedExtension =
      fileName.endsWith(".pdf") || fileName.endsWith(".doc") || fileName.endsWith(".docx");

    if (!hasAllowedExtension) {
      setStatus("Please upload a PDF or Word document (.pdf, .doc, .docx).", "is-error");
      return;
    }

    if (file.size > maxCvSizeBytes) {
      setStatus("CV file size must be 5MB or less.", "is-error");
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
      restoreJobFields();
      setStatus("Application submitted successfully. Our team will review your profile and respond shortly.", "is-success");
    } catch (error) {
      setStatus(error.message || "Unable to submit application. Please try again shortly.", "is-error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnLabel;
      }
    }
  });
})();
