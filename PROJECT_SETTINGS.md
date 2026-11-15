# Project Settings — Science Concepts Demonstrated

## CANONICAL REPOSITORY

https://github.com/ValRCS/Science_Concepts_Demonstrated

## PROJECT PURPOSE

Create a publicly accessible collection of interactive scientific, mathematical, and related educational demonstrations.

The primary objective is to make scientific concepts understandable through visualization, experimentation, interaction, progressive explanation, and academically grounded references.

The materials should be suitable for a family whose members range from primary-school children to university graduates, while remaining useful to teachers, students, and curious adults.

The project should encourage exploration, curiosity, independent reasoning, and a deeper understanding of how scientific and mathematical phenomena work.

## FOUR PROGRESSIVE EDUCATIONAL LEVELS

Every major concept should ideally provide four levels of explanation within the same interactive webpage.

The levels should represent increasing conceptual depth, mathematical sophistication, and academic rigor.

### LEVEL 1 — DISCOVER AND PLAY (approximately ages 7–10)

Audience: Primary-school children, including younger children with adult guidance.

Objectives:
- Capture attention with an engaging visual demonstration.
- Explain the central phenomenon using simple, concrete language.
- Encourage experimentation through direct interaction.
- Introduce intuitive cause-and-effect relationships.
- Connect the phenomenon to recognizable everyday experiences.

Characteristics:
- Colorful but scientifically meaningful illustrations and animations.
- Simple interactive controls, such as sliders, buttons, and draggable objects.
- Immediate visual feedback when parameters change.
- Short explanations and limited technical vocabulary.
- Minimal mathematical notation.
- Questions that encourage observation and prediction.

The primary educational goal is intuitive understanding rather than memorization.

### LEVEL 2 — EXPLORE AND UNDERSTAND (approximately ages 14–18)

Audience: Secondary-school and high-school students.

Objectives:
- Explain the scientific principles underlying the demonstration.
- Introduce appropriate terminology and conceptual models.
- Show relationships between observable phenomena and theoretical explanations.
- Develop reasoning through experiments, comparisons, and predictions.
- Introduce basic equations when they genuinely improve understanding.

Characteristics:
- More detailed explanations while retaining accessible language.
- Interactive experiments with multiple adjustable parameters.
- Simple graphs, measurements, and quantitative comparisons.
- Introductory formulas with explanations of symbols and units.
- Relevant real-world applications.
- Links to accessible educational sources and further reading.

The primary educational goal is conceptual understanding supported by introductory scientific reasoning.

### LEVEL 3 — ANALYZE AND MODEL (undergraduate/bachelor level)

Audience: University undergraduates, advanced secondary-school students, and scientifically curious adults.

Objectives:
- Provide a rigorous explanation of the underlying concepts.
- Introduce appropriate mathematical and computational models.
- Explain assumptions, variables, and relationships.
- Connect demonstrations to established scientific theories.
- Encourage analytical interpretation of results.
- Develop an understanding of model limitations.

Characteristics:
- Precise definitions and established scientific terminology.
- Equations and mathematical derivations where appropriate.
- Graphs, numerical experiments, and quantitative analysis.
- Explanation of model assumptions and boundary conditions.
- Examples connecting theoretical models with practical applications.
- References to university textbooks, academic teaching materials, and reputable scientific publications.

The primary educational goal is developing formal understanding and the ability to analyze the phenomenon independently.

### LEVEL 4 — INVESTIGATE AND RESEARCH (graduate/master's level)

Audience: Graduate students, researchers, educators, and academically trained adults from various disciplines.

Objectives:
- Provide a deeper, academically grounded treatment.
- Explain theoretical foundations, advanced models, and important derivations.
- Examine assumptions, limitations, alternative models, and unresolved questions.
- Connect the concept to established research and relevant scientific literature.
- Distinguish established results from approximations, active research, and speculation.
- Encourage further independent investigation.

Characteristics:
- Rigorous but readable academic explanations.
- Mathematical derivations, advanced models, and formal definitions where relevant.
- Discussion of methodological choices and theoretical limitations.
- Advanced parameter exploration and computational experimentation when useful.
- Historically important research and contemporary developments when relevant.
- Carefully selected academic references, preferably including seminal papers, review articles, scholarly books, and peer-reviewed research.
- Clear explanations of specialized concepts rather than unexplained jargon.

The primary educational goal is research-informed understanding, not unnecessary technical complexity.

A graduate-level treatment should be intellectually substantive while remaining accessible to an educated reader who may not specialize in the particular discipline.

## GENERAL PAGE STRUCTURE

Prefer a single-page interactive application for each scientific concept.

Each page should ideally contain:

1. A clear title and concise introduction.
2. An engaging initial visualization immediately demonstrating the central phenomenon.
3. Level 1: Discover and Play.
4. Level 2: Explore and Understand.
5. Level 3: Analyze and Model.
6. Level 4: Investigate and Research.
7. References and further reading, organized by level when useful.

The four levels may use tabs, expandable sections, progressive disclosure, or other intuitive navigation mechanisms.

The initial view should prioritize the Level 1 experience, while allowing visitors to move directly to any level.

Prefer sharing one underlying scientific model across levels, exposing more parameters, measurements, mathematical explanations, and analytical tools as the educational level increases.

Do not unnecessarily duplicate visualizations when a single adaptable demonstration serves all four levels.

Progressive levels must deepen the explanation without contradicting or invalidating scientifically accurate explanations at earlier levels.

## INTERACTIVE LEARNING PRINCIPLES

Interaction should support understanding rather than merely provide decoration.

Whenever appropriate:
- Allow visitors to manipulate meaningful physical or mathematical parameters.
- Show the consequences immediately.
- Include reset controls and useful starting configurations.
- Encourage predictions before revealing results.
- Display relevant numerical values, units, and graphs.
- Provide explanatory feedback about observed behavior.
- Include realistic examples alongside idealized models.
- Support exploratory learning without requiring users to follow a fixed sequence.

Avoid excessive animation, unnecessary gamification, and decorative features that obscure the scientific content.

## SCIENTIFIC AND ACADEMIC STANDARDS

Scientific correctness is essential at every educational level.

All explanations should:
- Use terminology accurately.
- Clearly identify simplifications and approximations.
- Distinguish mathematical models from physical reality.
- Explain assumptions and limitations where relevant.
- Use consistent notation and appropriate measurement units.
- Separate established scientific knowledge from hypotheses and speculation.
- Avoid presenting illustrative simulations as experimental evidence.
- Never invent academic references, publication details, or scientific findings.

References should become progressively more rigorous at higher levels.

Levels 1 and 2 may rely primarily on accessible educational resources.

Levels 3 and 4 should include authoritative academic sources wherever appropriate, with direct links, bibliographic information, and DOI identifiers when available and verified.

Use original explanations rather than reproducing extensive copyrighted material.

## TECHNOLOGICAL ARCHITECTURE

The canonical repository is hosted on GitHub.

Public educational pages are served through GitHub Pages from the docs/ directory.

The repository root and other directories may contain development documentation, research notes, reusable assets, organizational materials, and supporting code.

Preferred technologies:
- Semantic HTML5.
- Modern CSS.
- Vanilla JavaScript using standard browser APIs.
- SVG, Canvas, or other appropriate web visualization technologies.
- Lightweight mathematical rendering or visualization libraries when justified.

Avoid unnecessary frameworks, build systems, backend dependencies, and infrastructure complexity.

Prioritize:
- Static hosting compatibility.
- Responsive desktop, tablet, and mobile layouts.
- Good performance and efficient rendering.
- Accessible controls and keyboard navigation.
- Appropriate color contrast and reduced-motion support.
- Clear, reusable, maintainable source code.
- Compatibility with modern browsers.
- Working relative paths under GitHub Pages.

Complex libraries are acceptable when their educational or technical value clearly justifies them.

## SITE ORGANIZATION AND NAVIGATION

The docs/ directory should contain a public homepage providing an organized directory of scientific concepts.

Concepts may be grouped by discipline, including:
- Mathematics.
- Physics.
- Chemistry.
- Biology.
- Astronomy.
- Computer science.
- Other relevant scientific and interdisciplinary topics.

Each concept should have a meaningful title, short description, and navigation entry.

Use descriptive filenames and stable URLs.

Related concepts should link to one another where useful.

## DESIGN PHILOSOPHY

The site should feel like an interactive science museum combined with a serious academic learning resource.

It should be inviting to children without appearing childish to adults.

Maintain a consistent visual identity, typography, navigation system, and interaction patterns across concept pages.

Favor clarity, visual elegance, scientific accuracy, and genuinely useful interaction over visual complexity.

A playful tone is welcome at every level, including graduate level, provided that it does not compromise precision.

## CONTENT DEVELOPMENT WORKFLOW

When asked to create a new concept:

1. Identify the central phenomenon and its educational objectives.
2. Design the primary interactive visualization.
3. Establish a scientifically correct underlying model.
4. Develop explanations across the four educational levels.
5. Add progressively deeper controls, experiments, mathematical analysis, and references.
6. Integrate the concept into the existing site navigation.
7. Verify scientific correctness, usability, responsiveness, and technical functionality.
8. Follow existing repository conventions and preserve compatibility with other pages.

Prioritize completing a compelling, scientifically accurate demonstration over implementing unnecessary features.

When development scope is limited, create a working core visualization first and progressively add the educational levels without sacrificing scientific correctness.

## REPOSITORY WORKFLOW

Use the canonical repository as the source of truth.

Inspect existing files, navigation, shared styles, and architectural conventions before making changes.

Reuse existing components and patterns whenever practical.

When implementation and commits are requested, make focused changes, verify functionality, and provide meaningful commit descriptions.

Do not claim that changes have been committed or deployed without verification.

## OVERALL PRINCIPLE

Every scientific concept should be understandable at several depths.

A seven-year-old should be able to observe and experiment.

A teenager should be able to explain what is happening.

An undergraduate should be able to analyze the underlying model.

A graduate-level reader should be able to examine its mathematical foundations, assumptions, limitations, and scientific literature.

The same scientific phenomenon should connect all four experiences, allowing curiosity to develop naturally into rigorous understanding.
