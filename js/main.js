/**
 * Entry point. Renders the data-driven sections, wires up the navigation, and
 * mounts the skill constellation.
 *
 * Every block guards on the element existing, so all three pages can share this
 * one module without each needing its own bundle.
 */

import { skills, work, education, skillGroups } from "./data.js";
import { createConstellation } from "./constellation.js";

const KIND_LABEL = {
  experience: "Experience",
  project: "Project",
  publication: "Publication",
};

/** Escape text that gets interpolated into a template string. */
function escapeHTML(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value ?? "").replace(/[&<>"']/g, (char) => replacements[char]);
}

/** Render the experience timeline. */
function renderExperience(target) {
  const items = work.filter((item) => item.kind === "experience");

  target.innerHTML = items
    .map(
      (item) => `<li class="timeline-item">
        <div class="timeline-marker" aria-hidden="true"></div>
        <article class="timeline-body">
          <p class="timeline-period">${escapeHTML(item.period)}</p>
          <h3 class="timeline-role">${escapeHTML(item.role)}</h3>
          <p class="timeline-org">${escapeHTML(item.org)}${
            item.location ? ` &middot; ${escapeHTML(item.location)}` : ""
          }</p>
          <p class="timeline-summary">${escapeHTML(item.summary)}</p>
        </article>
      </li>`
    )
    .join("");
}

/** Render the project and publication cards. */
function renderWorkCards(target, kind) {
  const items = work.filter((item) => item.kind === kind);

  target.innerHTML = items
    .map(
      (item) => `<li class="col-12 col-lg-6">
        <article class="work-card card-${escapeHTML(item.kind)}">
          <p class="work-kind">${escapeHTML(KIND_LABEL[item.kind] ?? item.kind)}</p>
          <h3 class="work-title">${escapeHTML(item.title)}</h3>
          <p class="work-meta">${escapeHTML(item.org)}${
            item.period ? ` &middot; ${escapeHTML(item.period)}` : ""
          }</p>
          <p class="work-summary">${escapeHTML(item.summary)}</p>
          <ul class="work-details">
            ${item.details
              .map((detail) => `<li>${escapeHTML(detail)}</li>`)
              .join("")}
          </ul>
        </article>
      </li>`
    )
    .join("");
}

/** Render the education list. */
function renderEducation(target) {
  target.innerHTML = education
    .map(
      (entry) => `<li class="education-item">
        <h3 class="education-school">${escapeHTML(entry.school)}</h3>
        <p class="education-degree">${escapeHTML(entry.degree)}</p>
        <p class="education-meta">${escapeHTML(entry.period)} &middot; ${escapeHTML(
          entry.location
        )}</p>
        <p class="education-coursework">${escapeHTML(entry.coursework)}</p>
      </li>`
    )
    .join("");
}

/** Render the grouped skill lists. */
function renderSkillGroups(target) {
  target.innerHTML = skillGroups
    .map(
      (group) => `<li class="skill-group">
        <h3 class="skill-group-name">${escapeHTML(group.name)}</h3>
        <ul class="skill-group-items">
          ${group.items
            .map((item) => `<li class="skill-pill">${escapeHTML(item)}</li>`)
            .join("")}
        </ul>
      </li>`
    )
    .join("");
}

/** Fill the constellation's detail panel for the selected node. */
function renderDetail(panel, data, type) {
  if (!data) {
    panel.innerHTML = `<p class="detail-empty">
      Pick a skill to see everywhere I have used it, or pick a role to see what it
      was built with. Click the same one again to clear.
    </p>`;
    return;
  }

  if (type === "skill") {
    const related = work.filter((item) => item.skills.includes(data.id));
    panel.innerHTML = `<h3 class="detail-title">${escapeHTML(data.label)}</h3>
      <p class="detail-count">${related.length} ${
        related.length === 1 ? "place" : "places"
      } I have used it</p>
      <ul class="detail-list">
        ${related
          .map(
            (item) => `<li>
              <strong>${escapeHTML(item.title)}</strong>
              <span>${escapeHTML(item.org)}${
                item.period ? ` &middot; ${escapeHTML(item.period)}` : ""
              }</span>
            </li>`
          )
          .join("")}
      </ul>`;
    return;
  }

  const usedSkills = data.skills
    .map((id) => skills.find((skill) => skill.id === id))
    .filter(Boolean);

  panel.innerHTML = `<h3 class="detail-title">${escapeHTML(data.title)}</h3>
    <p class="detail-count">${escapeHTML(data.org)}${
      data.period ? ` &middot; ${escapeHTML(data.period)}` : ""
    }</p>
    <p class="detail-summary">${escapeHTML(data.summary)}</p>
    <ul class="detail-chips">
      ${usedSkills
        .map(
          (skill) => `<li class="skill-pill">${escapeHTML(skill.label)}</li>`
        )
        .join("")}
    </ul>`;
}

/** Collapsible navigation for narrow screens, without any Bootstrap JS. */
function initNav() {
  const toggle = document.querySelector("#navToggle");
  const menu = document.querySelector("#navMenu");
  if (!toggle || !menu) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

/** Stamp the current year into the footer. */
function initFooterYear() {
  document.querySelectorAll(".footer-year").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

/** Mount the constellation if this page has one. */
function initConstellation() {
  const canvas = document.querySelector("#constellationCanvas");
  const list = document.querySelector("#constellationList");
  const panel = document.querySelector("#constellationDetail");
  if (!canvas || !list || !panel) {
    return;
  }

  renderDetail(panel, null, null);

  const constellation = createConstellation({
    canvas,
    list,
    skills,
    work,
    onSelect(data, type) {
      renderDetail(panel, data, type);
    },
  });

  const reset = document.querySelector("#constellationReset");
  if (reset) {
    reset.addEventListener("click", () => constellation.select(null));
  }
}

function init() {
  const experience = document.querySelector("#experienceList");
  if (experience) {
    renderExperience(experience);
  }

  const projects = document.querySelector("#projectList");
  if (projects) {
    renderWorkCards(projects, "project");
  }

  const publications = document.querySelector("#publicationList");
  if (publications) {
    renderWorkCards(publications, "publication");
  }

  const educationList = document.querySelector("#educationList");
  if (educationList) {
    renderEducation(educationList);
  }

  const skillList = document.querySelector("#skillGroupList");
  if (skillList) {
    renderSkillGroups(skillList);
  }

  initConstellation();
  initNav();
  initFooterYear();
}

init();
