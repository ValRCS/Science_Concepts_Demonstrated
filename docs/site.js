/* Category navigation and searchable concept catalog. Source: docs/concepts.json. */
(() => {
  "use strict";

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "Earth & Space"];
  const levels = ["Primary", "Lower secondary", "Upper secondary", "University"];
  const search = document.getElementById("concept-search");
  const subjectFilter = document.getElementById("subject-filter");
  const levelFilter = document.getElementById("level-filter");
  const controls = document.getElementById("catalog-controls");
  const directory = document.getElementById("concept-grid");
  const status = document.getElementById("catalog-status");
  const total = document.getElementById("catalog-total");
  const clearButton = document.getElementById("clear-filters");
  const empty = document.getElementById("empty-state");
  const emptyTitle = document.getElementById("empty-title");
  const emptyDescription = document.getElementById("empty-description");
  const groups = Array.from(document.querySelectorAll("[data-directory-group]"));
  const subjectCards = Array.from(document.querySelectorAll("[data-subject-links]"));
  let concepts = [];

  // Restrict catalog links to this site's own visualization folders.
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

  function element(tag, className, value) {
    const node = document.createElement(tag);
    node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function makeCard(concept) {
    const card = element("article", "concept-card");
    const link = element("a", "concept-card-link");
    link.href = "./" + concept.path;
    link.setAttribute("aria-label", "Open " + concept.title + " interactive demonstration");
    const heading = element("h4", "", concept.title);
    const tags = element("div", "level-tags");
    for (const level of concept.levels) tags.append(element("span", "", level));
    link.append(
      element("span", "concept-category", concept.subject),
      heading,
      element("p", "", concept.summary),
      tags,
      element("span", "concept-card-action", "Open demonstration →")
    );
    card.append(link);
    return card;
  }

  function updateCategoryCards() {
    const counterNodes = Array.from(document.querySelectorAll("[data-count-for]"));
    total.textContent = concepts.length + " published " + (concepts.length === 1 ? "concept" : "concepts");
    for (const subject of subjects) {
      const items = concepts.filter(concept => concept.subject === subject)
        .sort((a, b) => a.title.localeCompare(b.title));
      const count = counterNodes.find(node => node.dataset.countFor === subject);
      if (count) count.textContent = items.length;
      const shortcutList = subjectCards.find(node => node.dataset.subjectLinks === subject);
      if (!shortcutList) continue;
      const shortcuts = items.slice(0, 3).map(concept => {
        const li = element("li", "");
        const link = element("a", "", concept.title + " ↗");
        link.href = "./" + concept.path;
        li.append(link);
        return li;
      });
      if (items.length > 3) {
        const more = element("li", "subject-more");
        const link = element("a", "", "See all " + items.length + " concepts →");
        link.href = Array.from(document.querySelectorAll("[data-subject-jump]"))
          .find(node => node.dataset.subjectJump === subject).getAttribute("href");
        more.append(link);
        shortcuts.push(more);
      }
      if (!items.length) shortcuts.push(element("li", "subject-coming-soon", "Concepts coming soon"));
      shortcutList.replaceChildren(...shortcuts);
    }
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const subject = subjectFilter.value;
    const level = levelFilter.value;
    const filteredView = Boolean(query || subject !== "All" || level !== "All");
    const filtered = concepts.filter(concept => {
      const text = [concept.title, concept.summary, concept.subject, ...concept.levels, ...(concept.keywords || [])]
        .join(" ").toLocaleLowerCase();
      return (subject === "All" || concept.subject === subject) &&
        (level === "All" || concept.levels.includes(level)) &&
        (!query || text.includes(query));
    });

    for (const group of groups) {
      const name = group.dataset.directoryGroup;
      const items = filtered.filter(concept => concept.subject === name)
        .sort((a, b) => a.title.localeCompare(b.title));
      group.hidden = !concepts.length || (filteredView && !items.length);
      group.querySelector("[data-concept-grid]").replaceChildren(...items.map(makeCard));
      group.querySelector("[data-group-placeholder]").hidden = items.length > 0;
      group.querySelector("[data-group-count]").textContent =
        items.length + " " + (items.length === 1 ? "concept" : "concepts");
    }

    clearButton.hidden = !filteredView;
    empty.hidden = concepts.length > 0 && (!filteredView || filtered.length > 0);
    if (!concepts.length) {
      status.textContent = "The collection has not published any concepts yet.";
      emptyTitle.textContent = "A collection in the making";
      emptyDescription.textContent = "New demonstrations will appear here as they are added to the catalog.";
    } else if (!filtered.length) {
      status.textContent = "0 concepts match your search and filters.";
      emptyTitle.textContent = "No matching concepts";
      emptyDescription.textContent = "Try another category, school level, or search term.";
    } else {
      const categoryCount = new Set(filtered.map(concept => concept.subject)).size;
      status.textContent = "Showing " + filtered.length + " of " + concepts.length +
        " concepts across " + categoryCount + " " + (categoryCount === 1 ? "category." : "categories.");
    }
  }

  function resetFilters() {
    search.value = "";
    subjectFilter.value = "All";
    levelFilter.value = "All";
    render();
  }

  clearButton.addEventListener("click", resetFilters);
  // Category links are regular anchors: they work as bookmarks and support back/forward navigation.
  // Reset an incompatible search first so that the destination section is not hidden.
  document.querySelectorAll("[data-subject-jump], [data-category-jump]").forEach(link => {
    link.addEventListener("click", resetFilters);
  });
  [search, subjectFilter, levelFilter].forEach(input => input.addEventListener("input", render));

  async function loadCatalog() {
    try {
      const response = await fetch("./concepts.json", {cache: "no-cache"});
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Catalog must be an array");
      concepts = data.filter(isConcept);
      if (concepts.length !== data.length) {
        console.warn("Some catalog entries were skipped because their metadata was invalid.");
      }
      controls.hidden = concepts.length === 0;
      updateCategoryCards();
      render();
    } catch (error) {
      controls.hidden = true;
      directory.hidden = true;
      total.textContent = "Catalog unavailable";
      status.textContent = "The concept catalog could not be loaded.";
      empty.hidden = false;
      emptyTitle.textContent = "Unable to load the directory";
      emptyDescription.textContent = "Please refresh this page. If viewing a local file, serve the docs folder over HTTP.";
      for (const list of subjectCards) {
        list.replaceChildren(element("li", "subject-coming-soon", "Catalog unavailable"));
      }
      console.error("Could not load concepts.json:", error);
    }
  }

  loadCatalog();
})();
