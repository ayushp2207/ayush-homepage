/**
 * Board rendering and interaction for the agent deliberation widget.
 *
 * Every square is a real <button> in a grid, so the whole board is operable
 * from the keyboard and announces itself to a screen reader. Pieces are
 * Unicode glyphs rather than images: no sprite sheet to load, and they scale
 * with the font.
 */

import {
  Position,
  START_FEN,
  PAWN,
  QUEEN,
  WHITE,
  squareName,
} from "./engine.js";
import { deliberate, describeMove, AGENTS } from "./agents.js";

// Filled glyphs for both colours; the fill and outline come from CSS, which
// renders far more consistently across fonts than the hollow "white" glyphs.
const GLYPH = { 1: "♟", 2: "♞", 3: "♝", 4: "♜", 5: "♛", 6: "♚" };
const NAME = {
  1: "pawn",
  2: "knight",
  3: "bishop",
  4: "rook",
  5: "queen",
  6: "king",
};

export function createBoard({ boardEl, statusEl, panelEl, resetEl, undoEl }) {
  const position = new Position();
  let selected = -1;
  let legalForSelected = [];
  let lastMove = null;
  let thinking = false;
  const squares = new Map();

  function buildGrid() {
    boardEl.innerHTML = "";
    for (let rank = 0; rank < 8; rank += 1) {
      for (let file = 0; file < 8; file += 1) {
        const square = rank * 16 + file;
        const button = document.createElement("button");
        button.type = "button";
        button.className =
          "chess-square " + ((rank + file) % 2 === 0 ? "is-light" : "is-dark");
        button.dataset.square = String(square);
        button.addEventListener("click", () => onSquare(square));
        squares.set(square, button);
        boardEl.appendChild(button);
      }
    }
  }

  function render() {
    for (const [square, button] of squares) {
      const piece = position.board[square];
      const type = Math.abs(piece);
      button.textContent = piece ? GLYPH[type] : "";
      button.classList.toggle("is-white-piece", piece > 0);
      button.classList.toggle("is-black-piece", piece < 0);
      button.classList.toggle("is-selected", square === selected);
      button.classList.toggle(
        "is-target",
        legalForSelected.some((m) => m.to === square)
      );
      button.classList.toggle(
        "is-capture",
        legalForSelected.some((m) => m.to === square) && piece !== 0
      );
      button.classList.toggle(
        "is-last",
        Boolean(lastMove) &&
          (square === lastMove.from || square === lastMove.to)
      );

      const where = squareName(square);
      button.setAttribute(
        "aria-label",
        piece
          ? `${where}, ${piece > 0 ? "white" : "black"} ${NAME[type]}`
          : `${where}, empty`
      );
    }
  }

  function setStatus(html) {
    statusEl.innerHTML = html;
  }

  function gameResult() {
    if (position.generateMoves().length > 0) return null;
    return position.inCheck()
      ? position.side === WHITE
        ? "Black wins by checkmate."
        : "White wins by checkmate."
      : "Draw by stalemate.";
  }

  function onSquare(square) {
    if (thinking || position.side !== WHITE) return;

    const piece = position.board[square];

    if (selected === -1) {
      if (piece > 0) {
        selected = square;
        legalForSelected = position
          .generateMoves()
          .filter((m) => m.from === square);
        render();
      }
      return;
    }

    if (square === selected) {
      selected = -1;
      legalForSelected = [];
      render();
      return;
    }

    const move = legalForSelected.find((m) => m.to === square);
    if (!move) {
      // Treat a click on another of your own pieces as reselecting.
      if (piece > 0) {
        selected = square;
        legalForSelected = position
          .generateMoves()
          .filter((m) => m.from === square);
      } else {
        selected = -1;
        legalForSelected = [];
      }
      render();
      return;
    }

    // Pawns always promote to a queen here; underpromotion is legal in the
    // engine but adding a picker would not teach anything extra.
    const chosen =
      Math.abs(position.board[move.from]) === PAWN && move.promotion
        ? legalForSelected.find((m) => m.to === square && m.promotion === QUEEN)
        : move;

    playUserMove(chosen);
  }

  function playUserMove(move) {
    const notation = describeMove(position, move);
    position.makeMove(move);
    lastMove = move;
    selected = -1;
    legalForSelected = [];
    render();

    const result = gameResult();
    if (result) {
      setStatus(`You played <strong>${notation}</strong>. ${result}`);
      renderPanel(null);
      return;
    }

    setStatus(
      `You played <strong>${notation}</strong>. The agents are deliberating…`
    );
    thinking = true;

    // Yield a frame so the board repaints before the search blocks.
    window.setTimeout(runAgents, 30);
  }

  function runAgents() {
    const started = performance.now();
    const report = deliberate(position, 3, 3);
    const elapsed = Math.round(performance.now() - started);

    if (!report.move) {
      thinking = false;
      setStatus(gameResult() ?? "No legal moves.");
      return;
    }

    const notation = describeMove(position, report.move);
    const agentNotations = report.agents.map((agent) => ({
      ...agent,
      notation: describeMove(position, agent.move),
    }));

    position.makeMove(report.move);
    lastMove = report.move;
    thinking = false;
    render();

    const result = gameResult();
    setStatus(
      result
        ? `The coordinator played <strong>${notation}</strong>. ${result}`
        : `The coordinator played <strong>${notation}</strong> — ` +
            `${report.consensus} of 3 agents agreed. ` +
            `<span class="chess-meta">${report.nodes.toLocaleString()} positions searched in ${elapsed}ms</span>`
    );
    renderPanel(agentNotations, report);
  }

  function renderPanel(agents, report) {
    // At rest, still show who the agents are and what each optimises for, so
    // the panel explains the idea before anyone makes a move.
    if (!agents) {
      panelEl.innerHTML = AGENTS.map(
        (agent) => `<li class="agent-card is-resting">
          <p class="agent-name">${agent.name}</p>
          <p class="agent-objective">${agent.objective}</p>
          <p class="agent-verdict">
            <span class="agent-waiting">waiting for your move</span>
          </p>
        </li>`
      ).join("");
      return;
    }

    panelEl.innerHTML = agents
      .map((agent) => {
        const agreed =
          report &&
          agent.move.from === report.move.from &&
          agent.move.to === report.move.to;
        const verdict = agent.indifferent
          ? `<span class="agent-indifferent">no preference — every move scored the same</span>`
          : `<span class="agent-move">${agent.notation}</span>
             <span class="agent-score">${agent.score > 0 ? "+" : ""}${agent.score}</span>`;
        return `<li class="agent-card${agreed ? " is-agreed" : ""}">
          <p class="agent-name">${agent.name}${
            agreed ? '<span class="agent-tick">adopted</span>' : ""
          }</p>
          <p class="agent-objective">${agent.objective}</p>
          <p class="agent-verdict">${verdict}</p>
        </li>`;
      })
      .join("");
  }

  function reset() {
    position.loadFen(START_FEN);
    selected = -1;
    legalForSelected = [];
    lastMove = null;
    thinking = false;
    render();
    setStatus(
      "You are White. Make a move and the three agents will each argue for a reply."
    );
    renderPanel(null);
  }

  function undo() {
    if (thinking) return;
    // One "turn" is your move plus the coordinator's reply.
    position.unmakeMove();
    position.unmakeMove();
    lastMove = null;
    selected = -1;
    legalForSelected = [];
    render();
    setStatus("Took back the last full move. Your turn.");
    renderPanel(null);
  }

  buildGrid();
  reset();

  if (resetEl) resetEl.addEventListener("click", reset);
  if (undoEl) {
    undoEl.addEventListener("click", () => {
      if (position.history.length >= 2) undo();
    });
  }

  return { reset, position };
}

export { AGENTS };
