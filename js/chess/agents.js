/**
 * Three specialist agents and a coordinator.
 *
 * This is the same shape as the multi-agent system I built at AT&T: several
 * narrow agents each optimise for their own objective, a parent reconciles
 * them, and the interesting signal is not the final answer but *where they
 * disagreed*. Chess is a good demonstration domain because the objectives
 * genuinely conflict — grabbing material often costs king safety.
 *
 * Each agent runs its own alpha-beta search over the same legal move
 * generator, scoring leaves with only its own evaluation function. The
 * coordinator searches once more with a weighted blend.
 */

import {
  PAWN,
  KNIGHT,
  BISHOP,
  ROOK,
  QUEEN,
  KING,
  WHITE,
  fileOf,
  rankOf,
  squareName,
} from "./engine.js";

const VALUE = {
  [PAWN]: 100,
  [KNIGHT]: 320,
  [BISHOP]: 330,
  [ROOK]: 500,
  [QUEEN]: 900,
  [KING]: 20000,
};

// Centre-weighted table, used for the "space" agent's piece placement.
// prettier-ignore
const CENTRALITY = [
  0,  5, 10, 15, 15, 10,  5,  0,
  5, 12, 20, 25, 25, 20, 12,  5,
 10, 20, 32, 38, 38, 32, 20, 10,
 15, 25, 38, 45, 45, 38, 25, 15,
 15, 25, 38, 45, 45, 38, 25, 15,
 10, 20, 32, 38, 38, 32, 20, 10,
  5, 12, 20, 25, 25, 20, 12,  5,
  0,  5, 10, 15, 15, 10,  5,  0,
];

function forEachPiece(position, visit) {
  for (let square = 0; square < 128; square += 1) {
    if (square & 0x88) {
      square += 7;
      continue;
    }
    const piece = position.board[square];
    if (piece !== 0) visit(square, piece);
  }
}

/** Raw material balance, in centipawns, from White's point of view. */
function evaluateMaterial(position) {
  let score = 0;
  forEachPiece(position, (square, piece) => {
    const value = VALUE[Math.abs(piece)];
    score += piece > 0 ? value : -value;
  });
  return score;
}

/** Central control and piece activity — material is deliberately ignored. */
function evaluateSpace(position) {
  let score = 0;
  forEachPiece(position, (square, piece) => {
    const type = Math.abs(piece);
    if (type === KING) return;
    const index = rankOf(square) * 8 + fileOf(square);
    let value = CENTRALITY[index];
    // Knights and bishops care most about the centre; rooks and queens less.
    if (type === KNIGHT || type === BISHOP) value *= 1.4;
    if (type === PAWN) value *= 0.8;
    if (type === QUEEN) value *= 0.4;
    score += piece > 0 ? value : -value;
  });
  return score;
}

/** Shelter around each king, and how exposed it is to enemy attack. */
function evaluateKingSafety(position) {
  let score = 0;

  for (const colour of [WHITE, -WHITE]) {
    const king = position.kingSquare(colour);
    if (king < 0) continue;
    let safety = 0;

    // Friendly pieces adjacent to the king are shelter.
    for (const delta of [-17, -16, -15, -1, 1, 15, 16, 17]) {
      const square = king + delta;
      if (square & 0x88) continue;
      const piece = position.board[square];
      if (piece !== 0 && piece * colour > 0) {
        safety += Math.abs(piece) === PAWN ? 26 : 12;
      }
      if (position.isAttacked(square, -colour)) safety -= 18;
    }

    if (position.isAttacked(king, -colour)) safety -= 70;

    // A king still near its back rank in the opening is a safe king.
    const homeRank = colour === WHITE ? 7 : 0;
    safety -= Math.abs(rankOf(king) - homeRank) * 14;

    score += colour === WHITE ? safety : -safety;
  }

  return score;
}

export const AGENTS = [
  {
    id: "material",
    name: "Material",
    objective: "Counts what is on the board and nothing else.",
    evaluate: evaluateMaterial,
    weight: 1.0,
  },
  {
    id: "space",
    name: "Space",
    objective: "Rewards central control and active pieces, ignores material.",
    evaluate: evaluateSpace,
    weight: 0.35,
  },
  {
    id: "safety",
    name: "King safety",
    objective: "Cares only about shelter and exposure around both kings.",
    evaluate: evaluateKingSafety,
    weight: 0.55,
  },
];

const MATE = 100000;

/** Order captures first so alpha-beta prunes far more of the tree. */
function orderMoves(position, moves) {
  return moves
    .map((move) => {
      const victim = position.board[move.to];
      const attacker = position.board[move.from];
      let score = 0;
      if (victim !== 0) {
        score = VALUE[Math.abs(victim)] * 10 - VALUE[Math.abs(attacker)];
      }
      if (move.promotion) score += VALUE[move.promotion];
      return { move, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.move);
}

/**
 * Negamax with alpha-beta pruning, scored by a single evaluation function.
 * Returns the score from the side-to-move's point of view.
 */
function search(position, depth, alpha, beta, evaluate, counter) {
  if (depth === 0) {
    counter.nodes += 1;
    return position.side * evaluate(position);
  }

  const moves = position.generateMoves();
  if (moves.length === 0) {
    // Checkmate is bad in proportion to how soon it arrives; stalemate is 0.
    return position.inCheck() ? -MATE - depth : 0;
  }

  let best = -Infinity;
  for (const move of orderMoves(position, moves)) {
    position.makeMove(move);
    const score = -search(
      position,
      depth - 1,
      -beta,
      -alpha,
      evaluate,
      counter
    );
    position.unmakeMove();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Best move for one evaluation function, plus its score for every root move. */
function bestMoveFor(position, depth, evaluate) {
  const counter = { nodes: 0 };
  const moves = orderMoves(position, position.generateMoves());
  const scored = [];

  for (const move of moves) {
    position.makeMove(move);
    const score = -search(
      position,
      depth - 1,
      -Infinity,
      Infinity,
      evaluate,
      counter
    );
    position.unmakeMove();
    scored.push({ move, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return { scored, nodes: counter.nodes };
}

/**
 * Run every agent, then the coordinator, and report where they disagreed.
 *
 * @param {Position} position Position to analyse; restored before returning.
 * @param {number} agentDepth Search depth for each specialist.
 * @param {number} coordinatorDepth Search depth for the blended search.
 * @returns {object} The chosen move, each agent's pick, and a consensus count.
 */
export function deliberate(position, agentDepth = 2, coordinatorDepth = 3) {
  const legal = position.generateMoves();
  if (legal.length === 0) {
    return { move: null, agents: [], consensus: 0, nodes: 0, gameOver: true };
  }

  let nodes = 0;
  const agents = AGENTS.map((agent) => {
    const { scored, nodes: agentNodes } = bestMoveFor(
      position,
      agentDepth,
      agent.evaluate
    );
    nodes += agentNodes;
    // Blended evaluations accumulate float noise; round to whole centipawns.
    const top = Math.round(scored[0].score);
    const worst = Math.round(scored[scored.length - 1].score);

    return {
      id: agent.id,
      name: agent.name,
      objective: agent.objective,
      move: scored[0].move,
      score: top,
      runnerUp: scored[1] ? scored[1].move : null,
      // Genuine indifference is when *every* legal move scores the same, not
      // merely when the top two tie — a tie between two strong moves is still
      // a real opinion about the rest of the position.
      indifferent: scored.length > 1 && top === worst,
    };
  });

  const blended = (pos) =>
    AGENTS.reduce((sum, agent) => sum + agent.weight * agent.evaluate(pos), 0);

  const { scored, nodes: coordNodes } = bestMoveFor(
    position,
    coordinatorDepth,
    blended
  );
  nodes += coordNodes;

  const chosen = scored[0].move;
  const chosenScore = Math.round(scored[0].score);
  const agreed = agents.filter(
    (a) => a.move.from === chosen.from && a.move.to === chosen.to
  ).length;

  return {
    move: chosen,
    score: chosenScore,
    agents,
    consensus: agreed,
    nodes,
    gameOver: false,
  };
}

const PIECE_LETTER = {
  [PAWN]: "",
  [KNIGHT]: "N",
  [BISHOP]: "B",
  [ROOK]: "R",
  [QUEEN]: "Q",
  [KING]: "K",
};

/** Short algebraic description of a move, with check and mate suffixes. */
export function describeMove(position, move) {
  if (move.castle) {
    return move.castle === "K" ? "O-O" : "O-O-O";
  }

  const piece = Math.abs(position.board[move.from]);
  const captures = position.board[move.to] !== 0 || Boolean(move.enPassant);
  const to = squareName(move.to);
  const promotion = move.promotion ? "=" + PIECE_LETTER[move.promotion] : "";

  // A pawn is named by its file, and only when it captures: "exd5", but "d4".
  const prefix =
    piece === PAWN
      ? captures
        ? squareName(move.from)[0]
        : ""
      : PIECE_LETTER[piece];

  // Look ahead one ply for check and mate.
  position.makeMove(move);
  let suffix = "";
  if (position.inCheck()) {
    suffix = position.generateMoves().length === 0 ? "#" : "+";
  }
  position.unmakeMove();

  return `${prefix}${captures ? "x" : ""}${to}${promotion}${suffix}`;
}
