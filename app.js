const elements = {
  authorFilter: document.querySelector("#author-filter"),
  collabCount: document.querySelector("#collab-count"),
  dataNote: document.querySelector("#data-note"),
  emptyReset: document.querySelector("#empty-reset"),
  emptyState: document.querySelector("#empty-state"),
  filters: document.querySelector("#filters"),
  lastUpdated: document.querySelector("#last-updated"),
  memberGrid: document.querySelector("#member-grid"),
  networkChart: document.querySelector("#network-chart"),
  paperCount: document.querySelector("#paper-count"),
  paperList: document.querySelector("#paper-list"),
  resetButton: document.querySelector("#reset-button"),
  resultsCount: document.querySelector("#results-count"),
  searchInput: document.querySelector("#search-input"),
  topicFilter: document.querySelector("#topic-filter"),
  yearChart: document.querySelector("#year-chart"),
  yearFilter: document.querySelector("#year-filter"),
  yearRange: document.querySelector("#year-range")
};

const state = {
  author: "",
  query: "",
  topic: "",
  year: ""
};

const topicColors = {
  "AI-generated content": "#d56655",
  "Adversarial robustness": "#815ac0",
  "Computer vision": "#2d83a3",
  "Dataset distillation": "#d49a32",
  "Deepfake detection": "#ef6a5b",
  "Generative models": "#9f64b1",
  "Graph learning": "#3c9b72",
  "Image restoration": "#348ca3",
  "Multimedia forensics": "#6c63a8",
  "Multimodal learning": "#d18d37",
  "Natural language processing": "#b06c98",
  "Privacy protection": "#1b9aaa",
  "Remote sensing": "#518d67",
  "Trustworthy AI": "#7a6ab5",
  "Watermarking": "#2f91a5"
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const normalize = (value) =>
  String(value)
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const readStateFromUrl = () => {
  const params = new URLSearchParams(location.search);
  state.query = params.get("q") || "";
  state.year = params.get("year") || "";
  state.author = params.get("author") || "";
  state.topic = params.get("topic") || "";
};

const writeStateToUrl = () => {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.year) params.set("year", state.year);
  if (state.author) params.set("author", state.author);
  if (state.topic) params.set("topic", state.topic);
  const query = params.toString();
  history.replaceState(null, "", query ? `${location.pathname}?${query}${location.hash}` : `${location.pathname}${location.hash}`);
};

const fillSelect = (select, options) => {
  for (const option of options) {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    select.append(element);
  }
};

const renderMembers = (data, authorById) => {
  const cards = data.authors.map((author) => {
    const count = data.papers.filter((paper) => paper.teamMembers.includes(author.id)).length;
    return `
      <a
        class="member-card"
        href="${escapeHtml(author.scholar)}"
        target="_blank"
        rel="noreferrer"
        style="--member-color: ${escapeHtml(author.color)}"
        aria-label="${escapeHtml(author.name)} 的 Google Scholar 主页，新窗口打开"
      >
        <div class="member-topline">
          <span class="avatar">${escapeHtml(author.initials)}</span>
          <span class="member-arrow" aria-hidden="true">↗</span>
        </div>
        <h3>${escapeHtml(author.name)}</h3>
        <p>${escapeHtml(author.focus)}</p>
        <span class="member-count"><i></i>${count} 篇收录论文</span>
      </a>
    `;
  });
  elements.memberGrid.innerHTML = cards.join("");
};

const renderYearChart = (papers) => {
  const counts = new Map();
  for (const paper of papers) counts.set(paper.year, (counts.get(paper.year) || 0) + 1);
  const years = [...counts.keys()].sort((a, b) => a - b);
  const max = Math.max(...counts.values());

  elements.yearChart.innerHTML = years
    .map((year) => {
      const count = counts.get(year);
      const height = 22 + (count / max) * 175;
      return `
        <div class="bar-group" title="${year}: ${count} 篇">
          <span class="bar-value">${count}</span>
          <span class="bar" style="height: ${height}px"></span>
          <span class="bar-year">${year}</span>
        </div>
      `;
    })
    .join("");
};

const renderNetwork = (data, authorById) => {
  const positions = {
    "ruiyang-xia": { x: 128, y: 78 },
    "lin-yuan": { x: 420, y: 80 },
    "jiawei-zhang": { x: 148, y: 225 },
    "xiao-pu": { x: 410, y: 218 }
  };
  const links = [];

  for (let i = 0; i < data.authors.length; i += 1) {
    for (let j = i + 1; j < data.authors.length; j += 1) {
      const source = data.authors[i].id;
      const target = data.authors[j].id;
      const count = data.papers.filter(
        (paper) => paper.teamMembers.includes(source) && paper.teamMembers.includes(target)
      ).length;
      if (count > 0) links.push({ count, source, target });
    }
  }

  const linkMarkup = links
    .map(({ count, source, target }) => {
      const a = positions[source];
      const b = positions[target];
      const middleX = (a.x + b.x) / 2;
      const middleY = (a.y + b.y) / 2 - 5;
      return `
        <g>
          <line class="network-link" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke-width="${2 + count * 0.8}" />
          <circle cx="${middleX}" cy="${middleY}" r="11" fill="#f8faf7" stroke="#dbe4e1" />
          <text class="network-link-label" x="${middleX}" y="${middleY + 3}">${count}</text>
        </g>
      `;
    })
    .join("");

  const nodeMarkup = data.authors
    .map((author) => {
      const position = positions[author.id];
      const count = data.papers.filter((paper) => paper.teamMembers.includes(author.id)).length;
      return `
        <g aria-label="${escapeHtml(author.name)}，${count} 篇">
          <circle class="network-node-circle" cx="${position.x}" cy="${position.y}" r="33" fill="${author.color}" />
          <text class="network-node-initials" x="${position.x}" y="${position.y + 6}">${escapeHtml(author.initials)}</text>
          <text class="network-node-name" x="${position.x}" y="${position.y + 55}">${escapeHtml(author.name)}</text>
          <text class="network-node-name" x="${position.x}" y="${position.y + 70}" opacity=".55">${count} papers</text>
        </g>
      `;
    })
    .join("");

  elements.networkChart.innerHTML = `
    <path d="M40 150C140 18 422 12 520 152C418 292 140 288 40 150Z" fill="none" stroke="#dce7e3" stroke-dasharray="3 8" />
    ${linkMarkup}
    ${nodeMarkup}
  `;
};

const renderAuthors = (paper, authorById) => {
  const teamNames = new Set(paper.teamMembers.map((id) => authorById.get(id).name));
  const renderName = (name) =>
    teamNames.has(name) ? `<strong>${escapeHtml(name)}</strong>` : escapeHtml(name);

  if (paper.authors.length <= 8) {
    return paper.authors.map(renderName).join(", ");
  }

  const firstAuthors = paper.authors.slice(0, 3);
  const retainedNames = new Set(firstAuthors);
  const retainedTeam = [...teamNames].filter((name) => !retainedNames.has(name));
  const pieces = [...firstAuthors.map(renderName)];
  if (retainedTeam.length) pieces.push(...retainedTeam.map(renderName));
  return `${pieces.join(", ")} <span aria-hidden="true">…</span> 共 ${paper.authors.length} 位作者`;
};

const renderPapers = (papers, authorById) => {
  const groups = new Map();
  for (const paper of papers) {
    if (!groups.has(paper.year)) groups.set(paper.year, []);
    groups.get(paper.year).push(paper);
  }

  let index = 0;
  const markup = [...groups.entries()]
    .sort(([yearA], [yearB]) => yearB - yearA)
    .map(([year, yearPapers]) => {
      const cards = yearPapers
        .map((paper) => {
          index += 1;
          const color = topicColors[paper.topic] || "#1b9aaa";
          const teamBadges = paper.teamMembers
            .map((id) => {
              const author = authorById.get(id);
              return `<span class="team-badge"><i style="background:${author.color}"></i>${escapeHtml(author.initials)}</span>`;
            })
            .join("");

          return `
            <article class="paper-card" style="--topic-color: ${color}; animation-delay: ${Math.min(index * 16, 240)}ms">
              <div class="paper-visual" aria-hidden="true">
                <span class="paper-index">${String(index).padStart(2, "0")}</span>
              </div>
              <div class="paper-content">
                <div class="paper-meta">
                  <span class="type-badge">${escapeHtml(paper.type)}</span>
                  <span class="topic-badge">${escapeHtml(paper.topic)}</span>
                  ${teamBadges}
                </div>
                <a class="paper-title" href="${escapeHtml(paper.url)}" target="_blank" rel="noreferrer">${escapeHtml(paper.title)}</a>
                <p class="paper-authors" title="${escapeHtml(paper.authors.join(", "))}">${renderAuthors(paper, authorById)}</p>
                <p class="paper-venue">${escapeHtml(paper.venue)}</p>
              </div>
              <a
                class="paper-link"
                href="${escapeHtml(paper.url)}"
                target="_blank"
                rel="noreferrer"
                aria-label="打开论文：${escapeHtml(paper.title)}"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 16 16 8M9 8h7v7" />
                  <path d="M16 14v5H5V8h5" />
                </svg>
              </a>
            </article>
          `;
        })
        .join("");

      return `
        <section class="year-group" aria-labelledby="year-${year}">
          <h3 class="year-label" id="year-${year}">${year}<small>${yearPapers.length} papers</small></h3>
          <div class="year-papers">${cards}</div>
        </section>
      `;
    })
    .join("");

  elements.paperList.innerHTML = markup;
  elements.paperList.hidden = papers.length === 0;
  elements.emptyState.hidden = papers.length !== 0;
};

const getFilteredPapers = (papers) => {
  const query = normalize(state.query);
  return papers.filter((paper) => {
    const searchable = normalize(
      [paper.title, paper.venue, paper.topic, paper.type, ...paper.authors].join(" ")
    );
    return (
      (!query || searchable.includes(query)) &&
      (!state.year || String(paper.year) === state.year) &&
      (!state.author || paper.teamMembers.includes(state.author)) &&
      (!state.topic || paper.topic === state.topic)
    );
  });
};

const resetFilters = () => {
  state.query = "";
  state.year = "";
  state.author = "";
  state.topic = "";
  elements.searchInput.value = "";
  elements.yearFilter.value = "";
  elements.authorFilter.value = "";
  elements.topicFilter.value = "";
};

const boot = async () => {
  let data;
  try {
    const response = await fetch("./data/papers.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    data = await response.json();
  } catch (error) {
    elements.paperList.innerHTML = `
      <div class="empty-state">
        <h3>论文数据加载失败</h3>
        <p>请通过本地服务器或 GitHub Pages 打开本站，而不是直接打开 HTML 文件。</p>
      </div>
    `;
    console.error(error);
    return;
  }

  const authorById = new Map(data.authors.map((author) => [author.id, author]));
  const years = [...new Set(data.papers.map((paper) => paper.year))].sort((a, b) => b - a);
  const topics = [...new Set(data.papers.map((paper) => paper.topic))].sort((a, b) => a.localeCompare(b));

  fillSelect(
    elements.yearFilter,
    years.map((year) => ({ value: String(year), label: `${year} 年` }))
  );
  fillSelect(
    elements.authorFilter,
    data.authors.map((author) => ({ value: author.id, label: author.name }))
  );
  fillSelect(
    elements.topicFilter,
    topics.map((topic) => ({ value: topic, label: topic }))
  );

  readStateFromUrl();
  if (!years.includes(Number(state.year))) state.year = "";
  if (!authorById.has(state.author)) state.author = "";
  if (!topics.includes(state.topic)) state.topic = "";
  elements.searchInput.value = state.query;
  elements.yearFilter.value = state.year;
  elements.authorFilter.value = state.author;
  elements.topicFilter.value = state.topic;

  const internalCollaborations = data.papers.filter((paper) => paper.teamMembers.length > 1).length;
  elements.paperCount.textContent = data.papers.length;
  elements.collabCount.textContent = internalCollaborations;
  elements.yearRange.textContent = `${Math.min(...years)}—${Math.max(...years)}`;
  elements.lastUpdated.textContent = data.site.lastUpdated;
  elements.lastUpdated.dateTime = data.site.lastUpdated;
  elements.dataNote.textContent = `${data.site.curationNote} · 更新于 ${data.site.lastUpdated}`;

  renderMembers(data, authorById);
  renderYearChart(data.papers);
  renderNetwork(data, authorById);

  const updateResults = () => {
    const filtered = getFilteredPapers(data.papers);
    renderPapers(filtered, authorById);
    elements.resultsCount.textContent =
      filtered.length === data.papers.length
        ? `共 ${filtered.length} 篇独立论文`
        : `显示 ${filtered.length} / ${data.papers.length} 篇论文`;
    writeStateToUrl();
  };

  elements.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    updateResults();
  });
  elements.yearFilter.addEventListener("change", (event) => {
    state.year = event.target.value;
    updateResults();
  });
  elements.authorFilter.addEventListener("change", (event) => {
    state.author = event.target.value;
    updateResults();
  });
  elements.topicFilter.addEventListener("change", (event) => {
    state.topic = event.target.value;
    updateResults();
  });
  elements.filters.addEventListener("reset", (event) => {
    event.preventDefault();
    resetFilters();
    updateResults();
  });
  elements.emptyReset.addEventListener("click", () => {
    resetFilters();
    updateResults();
    elements.searchInput.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "/" &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement.tagName)
    ) {
      event.preventDefault();
      elements.searchInput.focus();
    }
  });

  updateResults();
};

boot();
