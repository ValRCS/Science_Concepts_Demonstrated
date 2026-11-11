/* Static catalog for GitHub Pages. Add entries in concepts.json. */
(() => {
  "use strict";

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Earth & Space"];
  const levels = ["Primary", "Lower secondary", "Upper secondary", "University"];
  const search = document.getElementById("concept-search");
  const subjectFilter = document.getElementById("subject-filter");
  const levelFilter = document.getElementById("level-filter");
  const controls = document.getElementById("catalog-controls");
  const grid = document.getElementById("concept-grid");
  const status = document.getElementById("catalog-status");
  const total = document.getElementById("catalog-total");
  const empty = document.getElementById("empty-state");
  const emptyTitle = document.getElementById("empty-title");
  const emptyDescription = document.getElementById("empty-description");
  let concepts = [];

  // Restrict URLs to this site's own visualization folders.
  const safePath = /^visualizations\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;

  function isConcept(item) {
    return item && typeof item === "object" &&
      typeof item.id === "string" &&
      typeof item.title === "string" && item.title.trim() &&
      typeof item.summary === "string" &&
      subjects.includes(item.subject) &&
      Array.isArray(item.levels) && item.levels.length > 0 &&
      item.levels.every(level => levels.includes(level)) &&
      typeof item.path === "string" && safePath.test(item.path) &&
      (!("keywords" in item) || (Array.isArray(item.keywords) && item.keywords.every(k => typeof k === "string")));
  }

  function textElement(tag, className, value) {
    const element = document.createElement(tag);
    element.className = className;
    element.textContent = value;
    return element;
  }

  function makeCard(concept) {
    const card = document.createElement("article");
    card.className = "concept-card";
    card.append(textElement("span", "concept-category", concept.subject));
    const heading = document.createElement("h3");
    const link = document.createElement("a");
    link.href = "./" + concept.path;
    link.textContent = concept.title;
    heading.append(link);
    card.append(heading, textElement("p", "", concept.summary));
    const tags = document.createElement("div");
    tags.className = "level-tags";
    for (const level of concept.levels) tags.append(textElement("span", "", level));
    card.append(tags);
    return card;
  }

  function updateCounts() {
    total.textContent = concepts.length + " published " + (concepts.length === 1 ? "concept" : "concepts");
    for (const subject of subjects) {
      const count = document.querySelectorAll("[data-count-for]").length
        ? concepts.filter(concept => concept.subject === subject).length
        : 0;
      const display = Array.from(document.querySelectorAll("[data-count-for]"))
        .find(node => node.dataset.countFor === subject);
      if (display) display.textContent = count;
    }
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const subject = subjectFilter.value;
    const level = levelFilter.value;
    const filtered = concepts.filter(concept => {
      const text = [concept.title, concept.summary, concept.subject, ...concept.levels, ...(concept.keywords || [])]
        .join(" ").toLocaleLowerCase();
      return (subject === "All" || concept.subject === subject) &&
        (level === "All" || concept.levels.includes(level)) &&
        (!query || text.includes(query));
    });
    grid.replaceChildren(...filtered.map(makeCard));
    empty.hidden = filtered.length !== 0;
    if (!concepts.length) {
      status.textContent = "The collection has not published any concepts yet.";
      emptyTitle.textContent = "A collection in the making";
      emptyDescription.textContent = "The first interactive visualizations will appear here as they are published. In the meantime, explore the subjects above.";
    } else if (!filtered.length) {
      status.textContent = "0 concepts match your filters.";
      emptyTitle.textContent = "No matching concepts";
      emptyDescription.textContent = "Try another subject, level, or search term.";
    } else {
      status.textContent = "Showing " + filtered.length + " of " + concepts.length + " concepts.";
    }
  }

  function selectSubject(subject) {
    subjectFilter.value = subject;
    levelFilter.value = "All";
    search.value = "";
    render();
    document.getElementById("directory").scrollIntoView({ behavior: "auto" });
  }

  document.querySelectorAll("[data-subject]").forEach(button => {
    button.addEventListener("click", () => selectSubject(button.dataset.subject));
  });
  [search, subjectFilter, levelFilter].forEach(input => input.addEventListener("input", render));

  async function loadCatalog() {
    try {
      const response = await fetch("./concepts.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Catalog must be an array");
      concepts = data.filter(isConcept);
      if (concepts.length !== data.length) {
        console.warn("Some catalog entries were skipped because their metadata was invalid.");
      }
      controls.hidden = concepts.length === 0;
      updateCounts();
      render();
    } catch (error) {
      total.textContent = "Catalog unavailable";
      status.textContent = "The concept catalog could not be loaded.";
      empty.hidden = false;
      emptyTitle.textContent = "Unable to load the directory";
      emptyDescription.textContent = "Please try refreshing the page. If you opened the HTML file directly, serve the docs folder over HTTP instead.";
      console.error("Could not load concepts.json:", error);
    }
  }

  loadCatalog();
})();
