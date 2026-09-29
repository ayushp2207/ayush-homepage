/**
 * A TF-IDF retriever over my own work.
 *
 * This is the same shape as the retrieval layer I built at Pibit.ai and the
 * tool-selection routing from the MCP servers at AT&T and the WiNES lab: score
 * a natural-language query against a set of candidate documents, rank them,
 * and — the part that actually matters in production — be able to say *why* a
 * given candidate won, and refuse to answer when nothing scores well enough.
 *
 * Everything runs in the browser over a fixed corpus. No API, no key, no
 * network call, which is also what lets the page keep working indefinitely.
 */

// Words carrying no retrieval signal in this corpus.
const STOPWORDS = new Set(
  (
    "a an and are as at be but by did do does for from had has have he her his i if in into is it " +
    "its me my of on or our out over she so some such than that the their them then there these " +
    "they this to up was we were what when where which who why will with you your about can could " +
    "would should how any all been being also more most other use used using work works worked"
  ).split(" ")
);

/**
 * Light suffix stripping so "orchestrating", "orchestrated" and
 * "orchestration" collapse to one term. Deliberately not a full Porter
 * stemmer: the corpus is small and aggressive stemming creates false matches
 * that are then hard to explain to the reader.
 */
export function stem(word) {
  if (word.length <= 4) return word;

  // The -at- family first, and mapped to a shared stem rather than simply
  // removed: "orchestration", "orchestrating" and "orchestrated" must all
  // collapse to the same term or a query never matches the resume's wording.
  // Longest suffix first. "-ator" matters as much as "-ation" here: the
  // resume says "orchestrator" while a visitor types "orchestration", and
  // without this rule those two never meet.
  for (const [suffix, replacement] of [
    ["ations", "at"],
    ["ators", "at"],
    ["ation", "at"],
    ["ating", "at"],
    ["ator", "at"],
    ["ated", "at"],
  ]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, word.length - suffix.length) + replacement;
    }
  }

  for (const suffix of ["ingly", "ing", "edly", "ed", "ly", "es", "s"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, word.length - suffix.length);
    }
  }
  return word;
}

/** Lowercase, split on non-alphanumerics, drop stopwords, stem. */
export function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))
    .map(stem);
}

function termFrequencies(tokens) {
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

// BM25 parameters. k1 controls how fast term frequency saturates; b controls
// how strongly document length is normalised. These are the standard values.
const K1 = 1.5;
const B = 0.75;

/**
 * Build a BM25 index over the corpus.
 *
 * The first version of this scored cosine similarity over TF-IDF vectors, and
 * it had the classic failure: L2 normalisation over-rewards short documents,
 * so a two-line project description outranked a detailed one that was a
 * better match. BM25's length normalisation divides by length relative to the
 * corpus average instead, which is exactly the problem it was designed for.
 *
 * @param {Array<{id: string, text: string}>} documents Corpus.
 * @returns {object} Index of term frequencies, document lengths and IDF.
 */
export function buildIndex(documents) {
  const docFrequency = new Map();
  const prepared = documents.map((doc) => {
    const tokens = tokenize(doc.text);
    const counts = termFrequencies(tokens);
    for (const term of counts.keys()) {
      docFrequency.set(term, (docFrequency.get(term) ?? 0) + 1);
    }
    return { id: doc.id, counts, length: tokens.length };
  });

  const total = prepared.length;
  const averageLength =
    prepared.reduce((sum, doc) => sum + doc.length, 0) / (total || 1);

  const idf = new Map();
  for (const [term, df] of docFrequency) {
    // The "plus" variant, which stays positive even for terms appearing in
    // every document. The classic form goes negative there and can make a
    // matching term count against a document, which is impossible to explain
    // to a reader looking at the score breakdown.
    idf.set(term, Math.log(1 + (total - df + 0.5) / (df + 0.5)));
  }

  return { idf, documents: prepared, averageLength, size: total };
}

/**
 * Score a query against the index with BM25.
 *
 * @param {object} index Built by buildIndex.
 * @param {string} query Natural-language query.
 * @returns {{results: Array, queryTerms: Array, unmatched: Array}} Ranked hits.
 */
export function search(index, query) {
  const queryTerms = [...termFrequencies(tokenize(query)).keys()];

  const results = index.documents.map((doc) => {
    let score = 0;
    const contributions = [];

    for (const term of queryTerms) {
      const frequency = doc.counts.get(term);
      if (!frequency) continue;
      const idf = index.idf.get(term) ?? 0;
      const denominator =
        frequency +
        K1 * (1 - B + (B * doc.length) / (index.averageLength || 1));
      const contribution = (idf * (frequency * (K1 + 1))) / denominator;
      score += contribution;
      contributions.push({ term, contribution });
    }

    contributions.sort((a, b) => b.contribution - a.contribution);
    return { id: doc.id, score, contributions };
  });

  results.sort((a, b) => b.score - a.score);

  const matched = new Set(
    results.flatMap((r) => r.contributions.map((c) => c.term))
  );
  const unmatched = queryTerms.filter((t) => !matched.has(t));

  return { results, queryTerms, unmatched };
}

/**
 * Minimum BM25 score before we claim a match.
 *
 * A retriever that always returns its best guess is the most common way tool
 * routing goes wrong in production: it answers confidently out of the wrong
 * document. Below this, the honest output is "nothing here matches".
 */
export const CONFIDENCE_FLOOR = 0.9;
