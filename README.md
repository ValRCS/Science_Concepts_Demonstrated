# Science Concepts Demonstrated

**Interactive explanations of science and mathematics — one concept at a time.**

A growing collection of visual, browser-based learning resources for curious learners, including school-age students, university students, teachers, and independent explorers. The aim is to make abstract ideas easier to understand by combining accurate explanations with experimentation: change a parameter, observe the result, and connect the visualization to the underlying principle.

**Repository:** https://github.com/ValRCS/Science_Concepts_Demonstrated  
**Website (after enabling GitHub Pages):** https://valrcs.github.io/Science_Concepts_Demonstrated/

## What belongs here

- Self-contained interactive demonstrations, usually a single-page web application per concept.
- Clear, mathematically and scientifically sound explanations, with appropriate notation and units.
- Adjustable examples that encourage exploration rather than passive reading.
- Content spanning primary school, secondary school, and university.
- Optional exercises, further-reading links, references, and teaching notes.

Initial subject areas are **Mathematics, Physics, Chemistry, Biology, Computer Science, and Earth & Space**. Concepts may draw on more than one discipline; the catalog uses one primary subject per entry.

## Repository layout

```text
Science_Concepts_Demonstrated/
├── README.md                 # Project overview and authoring instructions
├── LICENSE                   # MIT license
└── docs/                     # GitHub Pages publication root
    ├── .nojekyll             # Publish static files without Jekyll processing
    ├── index.html            # Public homepage and concept directory
    ├── site.css              # Shared homepage styles
    ├── site.js               # Directory search and filtering
    ├── concepts.json         # Public concept catalog (source of navigation)
    └── visualizations/       # Self-contained concept pages
        └── <concept-slug>/
            └── index.html
```

The `visualizations/` convention now contains published pages, including LiDAR and dark matter. Source notes, planning materials, research, and other organizational files can live outside `docs/`.

## Run locally

No installation, package manager, or build pipeline is required for the current site. Serve the `docs` directory with a local HTTP server so the catalog can be loaded using `fetch`:

```bash
python -m http.server 8000 --directory docs
```

Then open http://localhost:8000/ . Opening `index.html` directly as a `file://` URL is not recommended because browsers commonly block local JSON requests.

## Publish with GitHub Pages

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the **main** branch and the **/docs** folder, then save.
4. Once GitHub finishes deployment, visit https://valrcs.github.io/Science_Concepts_Demonstrated/ .

GitHub Pages is **not activated merely by adding `docs/`**; these settings must be enabled in GitHub. The site uses relative URLs so it works both locally and under the repository's GitHub Pages subpath.

## Add a visualization

1. Create `docs/visualizations/<concept-slug>/index.html`, with any supporting CSS, JavaScript, images, and other assets kept in that concept's folder.
2. Make the page usable by itself, including a clear concept title, explanation, meaningful controls, labels, and a link back to the homepage (`../../`).
3. Add one catalog entry to `docs/concepts.json`, for example:

```json
[
  {
    "id": "example-concept",
    "title": "Example concept",
    "summary": "One or two sentences about the scientific idea and what can be explored.",
    "subject": "Mathematics",
    "levels": ["Lower secondary", "Upper secondary"],
    "path": "visualizations/example-concept/",
    "keywords": ["example", "interactive"]
  }
]
```

This example is **documentation only**; it is not registered in the live catalog and the example page does not exist.

The catalog must be a JSON array. Valid subjects are `Mathematics`, `Physics`, `Chemistry`, `Biology`, `Computer Science`, and `Earth & Space`. Valid levels are `Primary`, `Lower secondary`, `Upper secondary`, and `University`. Use URL-safe, lowercase hyphenated folder names, and set `path` to `visualizations/<concept-slug>/`. The homepage reads this manifest automatically and builds a **category-to-concept navigation directory**: six category cards link to their sections and list available concept pages; grouped concept cards link directly to demonstrations. Keyword search, category filtering, and school-level filtering refine the grouped directory. New entries appear automatically without editing the homepage. Category bookmarks use `#category-mathematics`, `#category-physics`, `#category-chemistry`, `#category-biology`, `#category-computer-science`, and `#category-earth-and-space`. All links remain relative for GitHub Pages.

### Recommended structure for an individual concept

- **Question or phenomenon:** what are we trying to understand?
- **Interactive model:** clearly labeled variables, controls, units, and immediate visual feedback.
- **Explanation:** the governing principle, mathematical relationships, and the interpretation of the output.
- **Try it:** guided challenges or thought experiments at relevant difficulty levels.
- **Limits and references:** assumptions, model limitations, and reputable sources where appropriate.

Favor accessible controls, keyboard operability, mobile layouts, descriptive text, and reduced-motion support. Distinguish idealized models from empirical reality. Prefer simple HTML/CSS/JavaScript where practical; frameworks can be used for more demanding visualizations as long as the published output is static and works on GitHub Pages.

## License

Released under the [MIT License](LICENSE). Educational use, reuse, and improvement are welcome; please retain applicable copyright and license notices.
