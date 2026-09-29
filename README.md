# Ayush Patel — Personal Homepage

A static personal homepage built with vanilla HTML5, CSS3 and ES6 modules. No
framework, no backend, no build step. Its centrepiece is a **chess engine
written from scratch**, played by a committee of three disagreeing agents — a
small, honest model of the multi-agent systems I build.

**🔗 Live site: https://ayushp2207.github.io/ayush-homepage/**

![The homepage hero](images/screenshot-home.png)

---

## Project objective

A résumé is a list of claims. "Kubernetes, PyTorch, LangChain" tells you I have
touched those things, but not _where_, _when_ or _how seriously_. Recruiters
skim for keywords; engineers want evidence.

So this site is built around one idea: **evidence, not adjectives.** Every skill
is linked to the role, project or paper where I actually used it, and the site
makes that link browsable instead of asking you to reconstruct it from prose.

---

## ⭐ The creative addition: an agent committee that plays chess

**This is the original component that differentiates this page.** It is a
complete chess engine written from scratch — **no chess library, no engine
binary, no chart library** — driven by three specialist agents that argue
about what to play.

![The agent board](images/screenshot-board.png)

### Why this and not a decorative widget

At AT&T I built a multi-agent system where one orchestrator coordinates three
specialist sub-agents over MCP. The useful signal there was never the final
answer; it was **where the specialists disagreed**, because disagreement is
where the interesting part of the position lives.

Chess is an honest demonstration domain for that, because the objectives
genuinely conflict. Taking a free pawn can wreck your king. A committee that
always agrees teaches you nothing; this one frequently doesn't.

### What it does

You play White. On each of your moves, three agents independently search the
position with **different evaluation functions**:

| Agent           | Optimises for                          | Ignores           |
| --------------- | -------------------------------------- | ----------------- |
| **Material**    | Raw piece values                       | Everything else   |
| **Space**       | Central control and piece activity     | Material entirely |
| **King safety** | Shelter and exposure around both kings | Material entirely |

Each runs its own alpha–beta search and votes. A **coordinator** then searches
with a weighted blend and picks the move, and the panel reports how many agents
it agreed with. When an agent genuinely has no preference — a pure material
agent in a quiet opening, where every move scores zero — it says so, instead of
presenting an arbitrary pick as a recommendation.

### The engine

In [`js/chess/engine.js`](js/chess/engine.js):

- **0x88 board representation** with make/unmake
- **Fully legal move generation**: castling through and out of check, en
  passant, promotion, pins, and checkmate/stalemate detection
- **Alpha–beta search** with capture-first move ordering

And in [`js/chess/agents.js`](js/chess/agents.js), the three evaluations, the
weighted coordinator, and algebraic move notation with check and mate suffixes.

### How I know the engine is correct

A chess move generator can be subtly wrong in ways that playing by hand will
never reveal — a missed en-passant edge case, castling through an attacked
square. So the engine is verified with **perft**: counting the leaf nodes of
the move tree to a fixed depth and comparing against published values.

| Position          | Depth | Expected | Result |
| ----------------- | ----- | -------- | ------ |
| Start position    | 4     | 197,281  | ✅     |
| Kiwipete          | 3     | 97,862   | ✅     |
| En passant / pins | 4     | 43,238   | ✅     |
| Promotions        | 3     | 9,467    | ✅     |
| Position 5        | 3     | 62,379   | ✅     |

All five standard suites pass exactly. A generator that matches perft on
Kiwipete is almost certainly right; one that does not is broken in a way no
amount of manual testing would surface.

Performance: roughly **12,000 positions searched in ~50ms** per move, so the
committee replies instantly with no web worker needed.

### Accessibility

Every square is a real `<button>` in a grid with an `aria-label` naming its
square and occupant, so the board is fully keyboard-operable and legible to a
screen reader. Pieces are Unicode glyphs, so there is no sprite sheet to load.

## A second interactive piece: the Skill Constellation

On the [Projects page](projects.html), a force-directed graph wires all 23
skills and work items together — pick a skill and every place I used it stays
lit while the rest dims. Also hand-written canvas code, using the
Fruchterman–Reingold formulation with the ideal edge length derived from canvas
area and node count, so it lays out correctly at 396px and 1098px with no
breakpoint-specific constants.

![The skill constellation](images/screenshot-constellation.png)

## Tech requirements

|                         |                                                                       |
| ----------------------- | --------------------------------------------------------------------- |
| Markup                  | HTML5, semantic sectioning, **0 W3C validator errors** on all 3 pages |
| Styles                  | Hand-written CSS3 with custom properties; **zero `!important`**       |
| Grid                    | Bootstrap 5.3 grid (CSS only, via CDN with SRI) + CSS flexbox/grid    |
| Scripting               | Vanilla ES6 modules (`type="module"`), no framework, no jQuery        |
| Graph                   | Hand-written 2D canvas, no graphing library                           |
| Tooling                 | ESLint (the class config) + Prettier — **0 errors**                   |
| Dependencies at runtime | None. Bootstrap's grid stylesheet is the only external asset.         |

### Pages

| Page                                       | Purpose                                                             |
| ------------------------------------------ | ------------------------------------------------------------------- |
| [`index.html`](index.html)                 | Identity, skill constellation, experience, education, toolkit       |
| [`projects.html`](projects.html)           | Longer write-ups of projects and publications                       |
| [`built-with-ai.html`](built-with-ai.html) | The assignment's AI-generated page, used as a full GenAI disclosure |

---

## How to install and use

Requires [Node.js](https://nodejs.org/) 18 or newer.

```bash
git clone https://github.com/ayushp2207/ayush-homepage.git
cd ayush-homepage
npm install
npm start
```

Then open **http://localhost:8080**.

The site is fully static, so any static server works — `python3 -m http.server`
is fine too. You do need a server rather than opening `index.html` directly,
because ES6 modules are blocked on `file://` URLs by browser security policy.

### Other scripts

```bash
npm run lint          # ESLint with the class config
npm run lint:fix      # ESLint with autofix
npm run format        # Prettier, write
npm run format:check  # Prettier, check only
```

### Deploying

Static site with no build step, so GitHub Pages serves the repo root directly:
**Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.**

---

## Project structure

```
.
├── index.html                 # Home
├── projects.html              # Projects & publications
├── built-with-ai.html         # AI-generated page / GenAI disclosure
├── css/
│   └── main.css               # All styles, organised by section
├── js/
│   ├── main.js                # Entry point: renders sections, wires nav
│   ├── data.js                # Single source of truth for all content
│   ├── constellation.js       # Force-directed skill graph (projects page)
│   └── chess/
│       ├── engine.js          # 0x88 board, legal move gen, perft
│       ├── agents.js          # Three evaluations + coordinator, alpha-beta
│       └── board-ui.js        # Board rendering and interaction
├── images/
│   ├── favicon.svg            # Monogram icon
│   └── screenshot-*.png       # README and design doc images
├── docs/
│   └── DESIGN.md              # Design document: personas, user stories, wireframes
├── eslint.config.js           # The class ESLint configuration
├── package.json               # "type": "module" — ES6 modules throughout
└── LICENSE                    # MIT
```

Content lives only in `js/data.js`. Both the constellation and the rendered page
sections read from it, so a role is never described in two places.

---

## Design document

**📄 [Design document (PDF)](docs/DESIGN.pdf)** &nbsp;|&nbsp;
[same content as Markdown](docs/DESIGN.md)

Covers the project description, three user personas, user stories with
acceptance criteria, information architecture, wireframes for desktop and
mobile, the design system, and a verification table.

---

## Use of GenAI

Required by the course rubric, and covered at greater length on the site's own
[Built with AI](built-with-ai.html) page.

**Tool:** [Claude Code](https://claude.com/claude-code), Anthropic's CLI coding
agent.
**Model:** Claude Opus 5 (`claude-opus-5`), 1M-context configuration.
**When:** September 2026.
**Other AI tools used:** none.

### What it was asked to do

1. Read the Project 1 assignment PDF and course slides, enumerate every rubric
   item, and separate what an agent could do from what only I could.
2. Scaffold the homepage in vanilla HTML5/CSS3/ES6 modules — no framework, no
   build step — using my résumé as the content source.
3. Propose a creative addition that wouldn't resemble other submissions, then
   implement it without a graphing library.
4. Wire up the class ESLint config and Prettier; make the markup pass the W3C
   validator.
5. Draft the design document (personas, user stories, wireframes).

### What was generated vs. hand-authored

**Generated, then reviewed by me:** the HTML skeletons, `css/main.css`, the three
ES6 modules including the force-directed layout, the `built-with-ai.html` page,
and the first draft of `docs/DESIGN.md`.

**Mine:** every factual claim on the site (roles, dates, metrics, publications —
all from my résumé, not the model); the decision that the creative addition
should be a skill-to-evidence graph; the narrated video; the code review; and the
final read-through of every file.

### Where the model was wrong

Worth recording, because it is the part people leave out:

- It **invented a Subresource Integrity hash** for the Bootstrap stylesheet
  instead of computing one. A wrong `integrity` value makes the browser refuse
  the file silently — the grid would simply not have loaded. The real hash had to
  be computed from the actual file.
- Its first constellation left a skill node with **no edges**, floating
  unconnected in the middle of the graph.
- It then **tuned the force constants twice by guessing**, producing a graph that
  first clumped into the centre and then flung every node into the corners.
  Guessing was the wrong approach; replacing the ad-hoc constants with the
  published Fruchterman–Reingold formulation fixed it properly.

---

## Author

**Ayush Nimeshkumar Patel**
MS Computer Science, Northeastern University · Boston, MA

- 🌐 Homepage: https://ayushp2207.github.io/ayush-homepage/
- 💼 LinkedIn: [linkedin.com/in/ayush-patel-912041221](https://www.linkedin.com/in/ayush-patel-912041221/)
- 💻 GitHub: [github.com/ayushp2207](https://github.com/ayushp2207)
- ✉️ ayushnpatelworks@gmail.com

## Class

Built for **[CS5610 Web Development](https://johnguerra.co/lectures/webDevelopment_fall2026/)**
at Northeastern University, taught by
[John Alexis Guerra Gómez](https://johnguerra.co/).

## Demo video

📹 _To be added before submission._

## License

[MIT](LICENSE) © 2026 Ayush Nimeshkumar Patel
