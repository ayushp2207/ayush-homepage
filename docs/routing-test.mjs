import { work, skills } from "../js/data.js";
import { buildIndex, search, CONFIDENCE_FLOOR } from "../js/retriever.js";

const label = new Map(skills.map((s) => [s.id, s.label]));
const docs = work.map((w) => ({
  id: w.id,
  text: [
    w.title,
    w.org,
    w.role ?? "",
    w.summary,
    ...(w.details ?? []),
    ...w.skills.map((s) => label.get(s) ?? s),
  ].join(" "),
}));
const index = buildIndex(docs);
console.log(
  "corpus:",
  docs.length,
  "documents,",
  index.idf.size,
  "unique terms\n"
);

const cases = [
  ["multi-agent orchestration over MCP", "dns-agents"],
  [
    "how do you keep data consistent under concurrent writes?",
    "transfer-family",
  ],
  ["computer vision on video", "mmwave"],
  ["reinforcement learning", "vr-wifi"],
  ["kubernetes and openshift", "wines-testbed"],
  ["retrieval augmented generation embeddings", "pibit"],
  ["formula 1 race strategy", "pit-wall"],
  ["bayesian networks", "rand-pc"],
  ["what did you build at amazon?", "transfer-family"],
  ["anomaly detection in DNS logs", "dns-agents"],
  ["tell me about your favourite pizza topping", null],
  ["blockchain smart contracts", null],
];

let pass = 0;
for (const [q, want] of cases) {
  const { results, unmatched } = search(index, q);
  const top = results[0];
  const confident = top.score >= CONFIDENCE_FLOOR;
  const got = confident ? top.id : null;
  const ok = got === want;
  if (ok) pass++;
  const terms = top.contributions
    .slice(0, 3)
    .map((c) => c.term)
    .join(", ");
  console.log(`${ok ? "PASS" : "FAIL"}  "${q}"`);
  console.log(
    `      -> ${got ?? "(no confident match)"}  score ${top.score.toFixed(3)}  want ${want ?? "(none)"}`
  );
  if (confident) console.log(`      driven by: ${terms}`);
  if (!confident && unmatched.length)
    console.log(`      unknown terms: ${unmatched.slice(0, 4).join(", ")}`);
}
console.log(`\n${pass}/${cases.length} routed correctly`);
