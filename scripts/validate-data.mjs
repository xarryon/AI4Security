import { readFile } from "node:fs/promises";

const dataUrl = new URL("../data/papers.json", import.meta.url);
const data = JSON.parse(await readFile(dataUrl, "utf8"));
const errors = [];
const authorIds = new Set(data.authors.map((author) => author.id));
const authorNames = new Map(data.authors.map((author) => [author.id, author.name]));
const titles = new Map();
const dois = new Map();

const normalizeTitle = (title) =>
  title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const normalizeDoi = (doi) =>
  (doi || "")
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .trim();

for (const [index, paper] of data.papers.entries()) {
  const location = `papers[${index}] (${paper.id || "missing id"})`;
  for (const field of ["id", "title", "year", "venue", "authors", "teamMembers", "url", "type", "topic"]) {
    if (paper[field] === undefined || paper[field] === "") {
      errors.push(`${location}: missing ${field}`);
    }
  }

  if (!Number.isInteger(paper.year) || paper.year < 2022) {
    errors.push(`${location}: year must be an integer >= 2022`);
  }
  if (!Array.isArray(paper.authors) || paper.authors.length === 0) {
    errors.push(`${location}: authors must be a non-empty array`);
  }
  if (!Array.isArray(paper.teamMembers) || paper.teamMembers.length === 0) {
    errors.push(`${location}: teamMembers must be a non-empty array`);
  }
  if (!/^https:\/\//.test(paper.url)) {
    errors.push(`${location}: url must use HTTPS`);
  }

  for (const memberId of paper.teamMembers || []) {
    if (!authorIds.has(memberId)) {
      errors.push(`${location}: unknown team member "${memberId}"`);
      continue;
    }
    if (!(paper.authors || []).includes(authorNames.get(memberId))) {
      errors.push(`${location}: team member "${authorNames.get(memberId)}" is absent from authors`);
    }
  }

  const titleKey = normalizeTitle(paper.title || "");
  if (titles.has(titleKey)) {
    errors.push(`${location}: duplicate normalized title with ${titles.get(titleKey)}`);
  } else {
    titles.set(titleKey, paper.id);
  }

  const doiKey = normalizeDoi(paper.doi);
  if (doiKey) {
    if (dois.has(doiKey)) {
      errors.push(`${location}: duplicate DOI with ${dois.get(doiKey)}`);
    } else {
      dois.set(doiKey, paper.id);
    }
  }
}

for (const author of data.authors) {
  if (!/^https:\/\/scholar\.google\./.test(author.scholar)) {
    errors.push(`author ${author.id}: scholar must be a Google Scholar HTTPS URL`);
  }
}

if (errors.length) {
  console.error(`Validation failed with ${errors.length} error(s):\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

const years = [...new Set(data.papers.map((paper) => paper.year))].sort((a, b) => b - a);
console.log(
  `Validated ${data.papers.length} unique papers, ${data.authors.length} team members, years ${years.at(-1)}–${years[0]}.`
);
