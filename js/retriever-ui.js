/**
 * The query widget: type a question, watch it route to a project, and see the
 * term-level scoring that decided it.
 *
 * Showing the breakdown is the whole point. A router that only prints an
 * answer asks you to trust it; one that shows which terms carried the score,
 * and which of your words it did not recognise, can be argued with.
 */

import { buildIndex, search, CONFIDENCE_FLOOR } from "./retriever.js";

const KIND_LABEL = {
  experience: "Experience",
  project: "Project",
  publication: "Publication",
};

function escapeHTML(value) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return String(value ?? "").replace(/[&<>"']/g, (c) => map[c]);
}

export function createRetriever({
  formEl,
  inputEl,
  resultEl,
  examplesEl,
  work,
  skills,
}) {
  const skillLabel = new Map(skills.map((s) => [s.id, s.label]));
  const byId = new Map(work.map((item) => [item.id, item]));

  // Each work item becomes one document. Title, organisation, summary, the
  // detail bullets and the skill labels all contribute.
  const index = buildIndex(
    work.map((item) => ({
      id: item.id,
      text: [
        item.title,
        item.org,
        item.role ?? "",
        item.summary,
        ...(item.details ?? []),
        ...item.skills.map((s) => skillLabel.get(s) ?? s),
      ].join(" "),
    }))
  );

  const EXAMPLES = [
    "multi-agent orchestration over MCP",
    "how do you keep data consistent under concurrent writes?",
    "computer vision on video",
    "retrieval augmented generation",
    "reinforcement learning",
  ];

  function renderExamples() {
    if (!examplesEl) return;
    examplesEl.innerHTML = EXAMPLES.map(
      (q) =>
        `<li><button class="example-chip" type="button" data-query="${escapeHTML(q)}">${escapeHTML(q)}</button></li>`
    ).join("");
    examplesEl.addEventListener("click", (event) => {
      const button = event.target.closest("[data-query]");
      if (!button) return;
      inputEl.value = button.dataset.query;
      run(button.dataset.query);
    });
  }

  function bar(score, max) {
    const pct = max > 0 ? Math.round((score / max) * 100) : 0;
    return `<span class="score-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>`;
  }

  function run(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      resultEl.innerHTML = `<p class="retriever-idle">Ask something and the router will pick a project.</p>`;
      return;
    }

    const { results, unmatched, queryTerms } = search(index, trimmed);
    const top = results[0];

    if (!top || top.score < CONFIDENCE_FLOOR) {
      resultEl.innerHTML = `<div class="retriever-miss">
        <p class="retriever-verdict">No confident match.</p>
        <p>
          Nothing in my work scores highly enough for that, so the honest
          answer is nothing rather than the closest thing lying around.
          ${
            unmatched.length
              ? `I don't have these terms at all: ${unmatched
                  .slice(0, 6)
                  .map((t) => `<code>${escapeHTML(t)}</code>`)
                  .join(", ")}.`
              : ""
          }
        </p>
      </div>`;
      return;
    }

    const item = byId.get(top.id);
    const max = top.score;
    const runnersUp = results
      .slice(1, 4)
      .filter((r) => r.score > 0)
      .map(
        (r) => `<li>
          <span class="runner-name">${escapeHTML(byId.get(r.id).title)}</span>
          ${bar(r.score, max)}
          <span class="runner-score">${r.score.toFixed(2)}</span>
        </li>`
      )
      .join("");

    resultEl.innerHTML = `<article class="retriever-hit">
      <p class="retriever-verdict">
        Routed to <strong>${escapeHTML(item.title)}</strong>
        <span class="hit-kind">${escapeHTML(KIND_LABEL[item.kind] ?? item.kind)}</span>
      </p>
      <p class="hit-org">${escapeHTML(item.org)}${
        item.period ? ` &middot; ${escapeHTML(item.period)}` : ""
      }</p>
      <p class="hit-summary">${escapeHTML(item.summary)}</p>

      <p class="hit-label">Terms that carried the score</p>
      <ul class="term-list">
        ${top.contributions
          .slice(0, 5)
          .map(
            (c) =>
              `<li><code>${escapeHTML(c.term)}</code><span>${c.contribution.toFixed(2)}</span></li>`
          )
          .join("")}
      </ul>

      ${
        unmatched.length
          ? `<p class="hit-unmatched">Not in my corpus: ${unmatched
              .slice(0, 6)
              .map((t) => `<code>${escapeHTML(t)}</code>`)
              .join(", ")}</p>`
          : ""
      }

      ${
        runnersUp
          ? `<p class="hit-label">Also considered</p>
             <ul class="runner-list">${runnersUp}</ul>`
          : ""
      }

      <p class="hit-meta">
        BM25 over ${index.size} documents, ${queryTerms.length} query term${
          queryTerms.length === 1 ? "" : "s"
        }, best score ${top.score.toFixed(2)}.
        <a href="projects.html">See all projects</a>
      </p>
    </article>`;
  }

  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    run(inputEl.value);
  });

  renderExamples();
  run("multi-agent orchestration over MCP");
  inputEl.value = "multi-agent orchestration over MCP";

  return { run };
}
