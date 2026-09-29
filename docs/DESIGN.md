# Design Document — Personal Homepage

**Author:** Ayush Nimeshkumar Patel
**Course:** [CS5610 Web Development](https://johnguerra.co/lectures/webDevelopment_fall2026/), Northeastern University
**Project:** Project 1 — Your personal home page
**Live site:** https://ayushp2207.github.io/ayush-homepage/
**Repository:** https://github.com/ayushp2207/ayush-homepage

---

## 1. Project description

### What this is

A static personal homepage built with vanilla HTML5, CSS3 and ES6 modules. No
backend, no framework, no component library, no build step. Bootstrap 5 is used
for its grid only; every other style is hand-written.

### The problem it solves

A résumé is a list of claims. "Kubernetes, PyTorch, LangChain" tells a reader
that I have touched those things, but not _where_, _when_, or _how seriously_.
Recruiters skim for keywords; engineers want evidence. The two audiences need the
same facts presented at different depths, and a flat list of bullet points serves
neither well.

So the organising idea of this site is **evidence, not adjectives**. Every skill
claim is wired to the specific role, project or paper where I used it, and the
site makes that wiring browsable rather than asking the reader to reconstruct it
from prose.

### Scope

Three pages:

| Page          | URL                  | Purpose                                                             |
| ------------- | -------------------- | ------------------------------------------------------------------- |
| Home          | `index.html`         | Identity, the skill constellation, experience, education, toolkit   |
| Projects      | `projects.html`      | Longer write-ups of projects and publications                       |
| Built with AI | `built-with-ai.html` | The assignment's AI-generated page, used as a full GenAI disclosure |

### Non-goals

- No blog or CMS. Content lives in one JavaScript module and is edited by hand.
- No contact form, because that would need a backend.
- No dark/light toggle. The site commits to one dark palette and does it well.

---

## 2. User personas

### Persona 1 — Priya, technical recruiter

- **Role:** University recruiter at a cloud infrastructure company.
- **Context:** Screening ~120 candidates for summer internships. Roughly 40
  seconds per profile on the first pass, on a laptop with a dozen tabs open.
- **Goals:** Confirm graduation date, work authorisation timing, and whether the
  candidate has shipped anything at production scale.
- **Frustrations:** Portfolios that open with a full-screen animation and bury
  the graduation date three scrolls down. Having to open a PDF to learn anything
  concrete.
- **What she needs from this site:** Name, current role, graduation date and
  availability visible without scrolling. One click to email.

### Persona 2 — Daniel, engineering hiring manager

- **Role:** Senior engineer who will run the technical interview.
- **Context:** Already read the résumé and is deciding whether to spend an hour
  on a phone screen. Reads carefully, and is sceptical of inflated claims.
- **Goals:** Find out whether the candidate's "multi-agent systems" experience is
  a tutorial project or real work; see actual code.
- **Frustrations:** Skill bars showing "Python 90%". Project cards with a title,
  a logo and no explanation of what was actually built or how hard it was.
- **What he needs from this site:** The ability to pick a technology and
  immediately see every place it was used, with enough detail to form a question.
  A link to source.

### Persona 3 — Meera, fellow student and peer reviewer

- **Role:** Classmate assigned to review this submission.
- **Context:** On a phone, between classes, working through a rubric.
- **Goals:** Check the rubric items — semantic markup, responsive layout, alt
  text, original JS, MIT license, README quality.
- **Frustrations:** Sites that only work at desktop width. Creative additions
  that turn out to be a copied library demo.
- **What she needs from this site:** A layout that holds up at 390px, a clearly
  identified creative addition, and an honest statement of what was generated.

---

## 3. User stories

Written as stories with acceptance criteria, so each one is testable.

### Epic A — Establish identity fast

**A1.** _As Priya, screening quickly, I want the candidate's name, current role
and availability without scrolling, so I can triage in seconds._

- Given a 1440×900 desktop viewport
- When the homepage loads
- Then the name, a one-sentence summary, and "Available … starting Summer 2027"
  are all visible above the fold
- And an email link is reachable in one click

**A2.** _As Priya, I want to know where the candidate studies and when they
graduate, so I can match them to a requisition._

- Given the homepage
- When I reach the Education section
- Then each degree shows institution, degree name, expected date and location

### Epic B — Turn skill claims into evidence

**B1.** _As Daniel, I want to select a technology and see every place it was
used, so I can tell real experience from a weekend tutorial._

- Given the skill constellation
- When I select the node "Kubernetes"
- Then a detail panel lists every role, project and publication using it
- And it states how many places that is
- And unrelated nodes visibly dim

**B2.** _As Daniel, I want to go the other direction — pick a role and see what
it was built with._

- Given the constellation
- When I select the node "Agentic 5G Spectrum Testbed"
- Then the panel shows that role's summary and the skills it used

**B3.** _As Daniel, I want to clear a selection without reloading._

- Given a selected node
- When I select the same node again, click empty canvas, or press "Clear
  selection"
- Then the filter clears and the panel returns to its prompt

**B4.** _As Meera on a phone, I want the same filtering without a mouse._

- Given a touch device or keyboard-only navigation
- When I Tab to the node list and press Enter
- Then that node is selected, `aria-pressed` becomes `true`, and the same detail
  panel updates
- So the canvas is never the only route to the information

### Epic C — Depth on demand

**C1.** _As Daniel, I want longer write-ups than a résumé bullet, so I can
prepare questions._

- Given the Projects page
- Then each entry has a summary plus specific detail points
- And publications are listed with venue and status

### Epic D — Work everywhere, for everyone

**D1.** _As Meera on a 390px phone, I want a usable layout._

- Given a 390px viewport
- Then the page never scrolls horizontally
- And the navigation collapses behind a labelled Menu button
- And the constellation still renders and responds

**D2.** _As a keyboard user, I want to skip repeated navigation._

- Given focus at the top of the document
- When I press Tab once
- Then a "Skip to main content" link appears and is focusable

**D3.** _As a screen reader user, I want the graph not to be a dead end._

- Given the canvas
- Then it exposes `role="img"` and a description saying the same nodes exist as
  buttons below

**D4.** _As someone with vestibular sensitivity, I don't want a graph animating
at me._

- Given `prefers-reduced-motion: reduce`
- Then the layout is computed without animating and painted once

### Epic E — Academic honesty

**E1.** _As the grader, I want to know exactly which parts were AI-generated._

- Given the "Built with AI" page
- Then it names the model and version, lists what was asked, separates generated
  from hand-authored content, and records where the model was wrong

---

## 4. Information architecture

```
index.html ............. Home
├── Hero ............... name, one-line pitch, contact, availability
├── Skill constellation  the creative addition
├── Experience ......... reverse-chronological timeline (4 roles)
├── Education .......... 2 degrees
└── Toolkit ............ grouped skill lists
projects.html .......... Projects (3) + Publications (2) + contact
built-with-ai.html ..... GenAI disclosure (the AI-generated page)
```

All three pages share one persistent header and footer. Content is defined once
in `js/data.js`; the constellation and the rendered sections both read from it,
so a role is never described in two places.

---

## 5. Design mockups

Wireframes produced before implementation. Final screenshots follow in section 8.

### 5.1 Home — desktop (≥ 992px)

```
┌───────────────────────────────────────────────────────────────────────┐
│ [AP] Ayush Patel            Home   Projects   Built with AI   GitHub │  sticky
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  BOSTON, MA                                                           │
│  Ayush Nimeshkumar Patel                          <- h1, clamp()      │
│  MS CS at Northeastern, currently building control-plane              │
│  services at AWS. Multi-agent AI systems and the                      │
│  infrastructure that makes them reliable.                             │
│                                                                       │
│  ( See my work ) ( email ) ( LinkedIn ) ( GitHub )    <- pill links   │
│                                                                       │
│  ▏Available for full-time roles starting Summer 2027  <- accent rule  │
│                                                                       │
├───────────────────────────────────────────────────────────────────────┤
│  SKILL CONSTELLATION                                                  │
│  A résumé tells you someone knows Kubernetes. It rarely tells         │
│  you where they used it.                                              │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │            ○ Databricks                                         │  │
│  │      ●────────┘      ╲                                          │  │
│  │   DNS Agents          ○ MCP ──── ● 5G Testbed                   │  │
│  │      ╲                 │                                        │  │
│  │       ◉ Python ────────┴──── ● Pibit                            │  │
│  │      ╱   ╲                                                      │  │
│  │  ◆ Pit Wall  ◇ Rand-PC                                          │  │
│  │                                                                 │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ ● Skill  ● Experience  ● Project  ● Publication                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  PICK A NODE                          ┌──────────────────────────┐    │
│  (AWS)(Computer Vision)(Databricks)   │ Python                   │    │
│  (Deep RL)(DynamoDB)(Java)(Python)    │ 7 PLACES I HAVE USED IT  │    │
│  (Kubernetes)(LangChain)(MCP) ...     │ ─ DNS Anomaly Detection  │    │
│  ( Clear selection )                  │ ─ 5G Spectrum Testbed    │    │
│                                       │ ─ Pit Wall               │    │
│         7 cols                        └──────── 5 cols ──────────┘    │
├───────────────────────────────────────────────────────────────────────┤
│  EXPERIENCE                                                           │
│  ●─ SEP 2026 – PRESENT                                                │
│  │  Software Development Engineer Intern                              │
│  │  Amazon Web Services · Boston, MA                                  │
│  │  Designing S3 endpoint configuration for Transfer Family…          │
│  ●─ JUN 2026 – AUG 2026                                               │
│  │  AI Engineer Intern …                                              │
├───────────────────────────────────────────────────────────────────────┤
│  EDUCATION            │  TOOLKIT                                      │
├───────────────────────────────────────────────────────────────────────┤
│  © 2026 Ayush Patel · Built for CS5610 · Home Projects Source         │
└───────────────────────────────────────────────────────────────────────┘
```

### 5.2 Home — mobile (< 768px)

Single column throughout. Nav collapses; the constellation keeps its full
interaction but shortens to 340px tall; the detail panel stacks under the chips.

```
┌───────────────────────────┐
│ [AP] Ayush Patel   (Menu) │
├───────────────────────────┤
│ BOSTON, MA                │
│ Ayush Nimeshkumar         │
│ Patel                     │
│ MS CS at Northeastern,    │
│ currently building…       │
│ ( See my work )           │
│ ( email ) ( LinkedIn )    │
│ ▏Available Summer 2027    │
├───────────────────────────┤
│ SKILL CONSTELLATION       │
│ ┌───────────────────────┐ │
│ │   ○──●   ◉ Python     │ │
│ │  ╱   ╲ ╱   ╲          │ │
│ │ ●     ○     ◆         │ │
│ ├───────────────────────┤ │
│ │ ●Skill ●Exp ●Proj     │ │
│ └───────────────────────┘ │
│ PICK A NODE               │
│ (AWS)(CV)(Databricks)     │
│ (Deep RL)(DynamoDB) ...   │
│ ┌───────────────────────┐ │
│ │ Python                │ │
│ │ 7 PLACES              │ │
│ └───────────────────────┘ │
├───────────────────────────┤
│ EXPERIENCE                │
│ ●─ SEP 2026 – PRESENT     │
│ │  SDE Intern             │
│ │  Amazon Web Services    │
└───────────────────────────┘
```

Nav open state:

```
┌───────────────────────────┐
│ [AP] Ayush Patel   (Menu) │  aria-expanded="true"
│ Home                      │
│ Projects                  │
│ Built with AI             │
│ GitHub                    │
└───────────────────────────┘
```

### 5.3 Projects — desktop

Two-column card grid (`col-12 col-lg-6`), collapsing to one column on mobile.

```
┌───────────────────────────────────────────────────────────────────────┐
│  SELECTED WORK                                                        │
│  Projects & Publications                                              │
│  Things I built or wrote up, in more detail than a résumé bullet.      │
├───────────────────────────────────────────────────────────────────────┤
│  PROJECTS                                                             │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐    │
│  │ PROJECT                      │ │ PROJECT                      │    │
│  │ Pit Wall: Multi-Agent F1     │ │ 6G mmWave Link Blockage      │    │
│  │ Personal project · Aug 2025  │ │ Research project · Jul 2024  │    │
│  │ Orchestrated 5 Llama 3       │ │ CNN-LSTM in PyTorch that     │    │
│  │ agents through AutoGen…      │ │ forecasts blockage…          │    │
│  │ • each agent argues a        │ │ • convolutional extractor    │    │
│  │   position…                  │ │   plus recurrent head        │    │
│  └──────────────────────────────┘ └──────────────────────────────┘    │
├───────────────────────────────────────────────────────────────────────┤
│  PUBLICATIONS                                                         │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐    │
│  │ PUBLICATION                  │ │ PUBLICATION                  │    │
│  │ Improving VR Performance…    │ │ Rand-PC: A Randomized…       │    │
│  └──────────────────────────────┘ └──────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────────┘
```

### 5.4 Constellation interaction states

```
Default (nothing selected)          Selected: "Python"
┌──────────────────────────┐        ┌──────────────────────────┐
│  all nodes full opacity  │        │  Python ringed white     │
│  hub labels only         │  ───▶  │  7 neighbours full       │
│  edges at 50% grey       │ click  │  others at 20% opacity   │
│                          │        │  their edges at 9%       │
│  panel: "Pick a skill…"  │        │  panel: 7 places listed  │
└──────────────────────────┘        └──────────────────────────┘
        ▲                                      │
        └────────── click again / Clear ───────┘
```

---

## 6. Design system

### Palette

Dark, low-chroma background so the four node colours carry the meaning.

| Token              | Value     | Use                     |
| ------------------ | --------- | ----------------------- |
| `--ink`            | `#0b1020` | Page background         |
| `--surface`        | `#111827` | Cards, nav, graph stage |
| `--surface-raised` | `#1b2337` | Pills and chips         |
| `--line`           | `#2b3550` | All borders and rules   |
| `--text`           | `#e2e8f0` | Body text               |
| `--text-muted`     | `#94a3b8` | Secondary text          |
| `--accent`         | `#5eead4` | Links, skill nodes      |
| `--accent-alt`     | `#818cf8` | Experience nodes        |
| `--accent-warm`    | `#f472b6` | Project nodes           |
| `--accent-gold`    | `#fbbf24` | Publication nodes       |

Node colour is the same in the graph, the legend, and the card accents, so the
encoding is learned once.

### Type and spacing

System font stack, so there is no web-font round trip. The `h1` uses
`clamp(2.1rem, 6vw, 3.4rem)` to scale without breakpoints. Body copy is capped
at `58–70ch` for readability. Spacing is a six-step scale
(`0.25/0.5/1/1.5/2.5/4rem`) exposed as custom properties, so vertical rhythm
stays consistent.

### CSS conventions

- Every element is targeted by **class**, never by id, and never by bare tag
  beyond base resets.
- **Zero `!important`** in the stylesheet (verified: `grep -c '!important'` → 0).
- Layout uses Bootstrap's grid plus CSS flexbox and grid. One deliberate
  override: `.page-wrap .row` zeroes Bootstrap's negative gutters, because
  `.page-wrap` is not a Bootstrap `.container` and the negative margins
  otherwise cause horizontal overflow on mobile.

### Accessibility decisions

| Concern                      | Decision                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| Keyboard access to the graph | Every node is also a real `<button>` with `aria-pressed`        |
| Screen readers               | Canvas is `role="img"` with a label pointing at the button list |
| Skip navigation              | `.skip-link`, off-screen until focused                          |
| Focus visibility             | One shared `:focus-visible` outline, 3px, offset 3px            |
| Motion sensitivity           | `prefers-reduced-motion` settles the layout without animating   |
| Semantic controls            | Buttons are `<button>`, links are `<a>` — no clickable `<div>`  |
| Images                       | Every `<img>` carries a real `alt`                              |

---

## 7. The creative addition: Skill Constellation

### Why this and not a honeycomb grid

The assignment's own example is a honeycomb image grid, so that is the one thing
guaranteed to appear in other submissions. More importantly, a decorative grid
does not answer the question a hiring manager actually has. The constellation is
chosen because it is the _only_ element on the site that does something a static
résumé cannot: it inverts the relationship between skill and evidence on demand.

### How it works

A force-directed graph on a `<canvas>`, using the Fruchterman–Reingold
formulation:

- **Repulsion** between every pair of nodes: `f = k² / d`
- **Attraction** along every edge: `f = d² / k`
- **Ideal distance** `k = 0.62 · √(area / nodeCount)` — derived from the canvas
  size and node count, so the same code lays out correctly at 396px and 1098px
  with no breakpoint-specific constants
- **Cooling**: a temperature caps how far any node may move per step and decays
  by 2.5% per frame, so the graph converges instead of oscillating
- **Weak centring** keeps disconnected components from drifting off-frame

23 nodes (14 skills + 9 work items) and 26 edges. Animation halts once total
movement falls below a threshold, so it does not burn CPU idling.

Labels are drawn in a second pass, in priority order, with rectangle-collision
detection: a label that would overlap one already drawn is skipped. Without this
the graph is unreadable — the first implementation drew all 23 labels and they
piled on top of each other.

### Honest limitations

- The layout is deterministic by seeding positions on two rings, but it is still
  a physical simulation, so a resize past 40px reseeds and re-settles.
- Disconnected clusters drift apart. The AWS role sits on its own because Java,
  DynamoDB and AWS are not shared with any other entry. That is truthful, and
  arguably the most informative thing the graph says.

---

## 8. Final implementation

### Home — hero

![Homepage hero](../images/screenshot-home.png)

### Skill constellation with "Python" selected

![Skill constellation](../images/screenshot-constellation.png)

Python is ringed; its 7 connected work items stay at full opacity while the rest
of the graph drops to 20%. The detail panel lists each one.

### Mobile

![Mobile layout](../images/screenshot-mobile.png)

---

## 9. Verification

| Check                      | Method                               | Result       |
| -------------------------- | ------------------------------------ | ------------ |
| W3C validity               | `validator.w3.org/nu` on all 3 pages | **0 errors** |
| ESLint (class config)      | `npx eslint .`                       | **0 errors** |
| Prettier                   | `npx prettier --check`               | clean        |
| Console errors             | Headless Chrome, all 3 pages         | **none**     |
| Images have alt            | DOM audit                            | 0 missing    |
| Horizontal scroll at 390px | `scrollWidth` vs `innerWidth`        | none         |
| Keyboard filtering         | Tab + Enter on node list             | works        |
| `!important` count         | `grep -c` on the stylesheet          | 0            |
