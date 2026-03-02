(() => {
  const jobs = {
    "senior-ai-product-engineer": {
      code: "AUR-ENG-001",
      title: "Senior AI Product Engineer",
      lead: "Lead implementation of production AI workflows in enterprise SaaS and industrial systems.",
      location: "Lahore, Pakistan (with Dubai collaboration)",
      workModel: "Hybrid, Full-time",
      experience: "5+ years",
      summary:
        "You will own AI-enabled product features from architecture to deployment and work directly with product and delivery leadership.",
      responsibilities: [
        "Design, build, and deploy AI-powered modules for enterprise products.",
        "Integrate LLM and data pipelines into secure, production-ready services.",
        "Collaborate with UX, backend, and DevOps teams on release delivery.",
        "Improve model performance, observability, and inference cost efficiency."
      ],
      requirements: [
        "Strong experience in Python or TypeScript backend engineering.",
        "Hands-on experience with modern AI APIs and vector data workflows.",
        "Solid understanding of cloud deployment and CI/CD practices.",
        "Ability to communicate technical trade-offs with clarity."
      ]
    },
    "enterprise-solutions-architect": {
      code: "AUR-SOL-002",
      title: "Enterprise Solutions Architect",
      lead: "Design scalable architectures for industrial digitisation and multi-system integrations.",
      location: "Dubai, UAE (regional travel as required)",
      workModel: "Hybrid, Full-time",
      experience: "7+ years",
      summary:
        "You will define technical solution blueprints for enterprise dashboards, ERP modernisation, and automation programmes.",
      responsibilities: [
        "Lead architecture design for client platforms across multiple sectors.",
        "Define integration standards, data contracts, and security baselines.",
        "Translate business goals into practical technical roadmaps.",
        "Support pre-sales technical workshops and implementation planning."
      ],
      requirements: [
        "Proven experience in enterprise solution architecture roles.",
        "Deep understanding of APIs, event-driven systems, and data platforms.",
        "Experience with cloud infrastructure and governance controls.",
        "Strong stakeholder communication and documentation discipline."
      ]
    },
    "full-stack-product-engineer": {
      code: "AUR-ENG-003",
      title: "Full Stack Product Engineer",
      lead: "Build and modernise web applications for enterprise operations and analytics use cases.",
      location: "Lahore, Pakistan",
      workModel: "On-site / Hybrid, Full-time",
      experience: "3+ years",
      summary:
        "You will ship frontend and backend features for internal products and client delivery projects with measurable business outcomes.",
      responsibilities: [
        "Develop robust web interfaces and APIs for B2B products.",
        "Implement secure authentication, role management, and reporting features.",
        "Write maintainable tests and support production troubleshooting.",
        "Collaborate with product teams to iterate quickly and safely."
      ],
      requirements: [
        "Strong JavaScript or TypeScript across frontend and backend.",
        "Experience with modern component-based frontend frameworks.",
        "Comfort with relational databases and REST API design.",
        "Clear communication and ownership mindset."
      ]
    }
  };

  const fallbackSlug = "senior-ai-product-engineer";
  const url = new URL(window.location.href);
  const requestedSlug = (url.searchParams.get("job") || "").trim();
  const slug = Object.prototype.hasOwnProperty.call(jobs, requestedSlug)
    ? requestedSlug
    : fallbackSlug;
  const job = jobs[slug];

  const byId = (id) => document.getElementById(id);

  const setText = (id, value) => {
    const el = byId(id);
    if (el) el.textContent = value;
  };

  const setList = (id, items) => {
    const el = byId(id);
    if (!el) return;
    el.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      el.appendChild(li);
    });
  };

  setText("jobTitleHeading", job.title);
  setText("jobLead", job.lead);
  setText("jobCode", job.code);
  setText("jobLocation", job.location);
  setText("jobType", job.workModel);
  setText("jobExperience", job.experience);
  setText("jobSummary", job.summary);
  setText("jobApplyRole", `Applying for: ${job.title}`);
  setList("jobResponsibilities", job.responsibilities);
  setList("jobRequirements", job.requirements);

  const titleInput = byId("jobTitleInput");
  const codeInput = byId("jobCodeInput");
  if (titleInput) titleInput.value = job.title;
  if (codeInput) codeInput.value = job.code;

  const form = byId("applicationForm");
  if (form) {
    form.dataset.jobTitle = job.title;
    form.dataset.jobCode = job.code;
  }

  document.title = `${job.title} | AURMAK Careers`;
})();
