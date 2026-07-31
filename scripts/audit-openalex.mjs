import { readFile } from "node:fs/promises";

const dataUrl = new URL("../data/papers.json", import.meta.url);
const data = JSON.parse(await readFile(dataUrl, "utf8"));

const normalizeTitle = (title) =>
  String(title)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const normalizeDoi = (doi) =>
  String(doi || "")
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .trim();

const existingTitles = new Set(data.papers.map((paper) => normalizeTitle(paper.title)));
const existingDois = new Set(data.papers.map((paper) => normalizeDoi(paper.doi)).filter(Boolean));
const candidates = new Map();

for (const author of data.authors) {
  const query = new URLSearchParams({
    filter: `author.orcid:${author.orcid},from_publication_date:2022-01-01`,
    "per-page": "100",
    select: "id,title,publication_year,doi,primary_location,type"
  });
  const response = await fetch(`https://api.openalex.org/works?${query}`, {
    headers: { "user-agent": "team-publications-audit/1.0 (mailto:replace-with-maintainer@example.com)" }
  });
  if (!response.ok) throw new Error(`OpenAlex request failed for ${author.name}: HTTP ${response.status}`);
  const payload = await response.json();

  for (const work of payload.results) {
    const titleKey = normalizeTitle(work.title);
    const doiKey = normalizeDoi(work.doi);
    if (existingTitles.has(titleKey) || (doiKey && existingDois.has(doiKey))) continue;

    const key = doiKey || titleKey;
    const current = candidates.get(key) || {
      authors: [],
      doi: doiKey,
      title: work.title,
      type: work.type,
      url: work.primary_location?.landing_page_url || work.id,
      year: work.publication_year
    };
    current.authors.push(author.name);
    candidates.set(key, current);
  }
}

if (candidates.size === 0) {
  console.log("No OpenAlex candidates were found outside the curated dataset.");
  process.exit(0);
}

console.log(
  [
    `OpenAlex returned ${candidates.size} candidate record(s) not found in data/papers.json.`,
    "Review every candidate manually: author-index services can merge people with the same name.",
    ""
  ].join("\n")
);

for (const candidate of [...candidates.values()].sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))) {
  console.log(
    [
      `[${candidate.year}] ${candidate.title}`,
      `  matched team profile: ${candidate.authors.join(", ")}`,
      `  type: ${candidate.type}`,
      `  link: ${candidate.url}`,
      candidate.doi ? `  DOI: ${candidate.doi}` : ""
    ]
      .filter(Boolean)
      .join("\n")
  );
}
