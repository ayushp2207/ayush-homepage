/**
 * A small but complete chess engine: 0x88 board representation, fully legal
 * move generation (castling, en passant, promotion, pins and check), and
 * make/unmake.
 *
 * Correctness is verified with perft — counting leaf nodes of the move tree to
 * a fixed depth and comparing against published values. A move generator that
 * matches perft on both the start position and "Kiwipete" is almost certainly
 * right; one that does not is subtly broken in a way no amount of playing by
 * hand would reveal.
 */

export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export const WHITE = 1;
export const BLACK = -1;

// Castling-rights bit flags.
const WK = 1;
const WQ = 2;
const BK = 4;
const BQ = 8;

const KNIGHT_DELTAS = [-33, -31, -18, -14, 14, 18, 31, 33];
const KING_DELTAS = [-17, -16, -15, -1, 1, 15, 16, 17];
const BISHOP_DELTAS = [-17, -15, 15, 17];
const ROOK_DELTAS = [-16, -1, 1, 16];

/** A square index is on the board when its 0x88 bits are clear. */
function onBoard(square) {
  return (square & 0x88) === 0;
}

export function fileOf(square) {
  return square & 7;
}

export function rankOf(square) {
  return square >> 4;
}

/** "e4" -> 0x88 index. */
export function squareFromName(name) {
  const file = name.charCodeAt(0) - 97;
  const rank = 8 - Number(name[1]);
  return rank * 16 + file;
}

/** 0x88 index -> "e4". */
export function squareName(square) {
  return String.fromCharCode(97 + fileOf(square)) + (8 - rankOf(square));
}

const FEN_PIECES = {
  p: -PAWN,
  n: -KNIGHT,
  b: -BISHOP,
  r: -ROOK,
  q: -QUEEN,
  k: -KING,
  P: PAWN,
  N: KNIGHT,
  B: BISHOP,
  R: ROOK,
  Q: QUEEN,
  K: KING,
};

export const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export class Position {
  constructor(fen = START_FEN) {
    this.board = new Int8Array(128);
    this.history = [];
    this.loadFen(fen);
  }

  loadFen(fen) {
    const [placement, side, castling, ep] = fen.split(/\s+/);
    this.board.fill(EMPTY);

    let square = 0;
    for (const char of placement) {
      if (char === "/") {
        square += 8;
      } else if (char >= "1" && char <= "8") {
        square += Number(char);
      } else {
        this.board[square] = FEN_PIECES[char];
        square += 1;
      }
    }

    this.side = side === "w" ? WHITE : BLACK;
    this.castling = 0;
    if (castling.includes("K")) this.castling |= WK;
    if (castling.includes("Q")) this.castling |= WQ;
    if (castling.includes("k")) this.castling |= BK;
    if (castling.includes("q")) this.castling |= BQ;
    this.ep = ep && ep !== "-" ? squareFromName(ep) : -1;
    this.history.length = 0;
  }

  /** Square of the given colour's king, or -1. */
  kingSquare(colour) {
    for (let square = 0; square < 128; square += 1) {
      if (!onBoard(square)) {
        square += 7;
        continue;
      }
      if (this.board[square] === colour * KING) {
        return square;
      }
    }
    return -1;
  }

  /** Is `square` attacked by any piece of `bySide`? */
  isAttacked(square, bySide) {
    // Pawns. bySide moves "up" the board for white (negative index delta).
    const pawnDir = bySide === WHITE ? 16 : -16;
    for (const side of [-1, 1]) {
      const from = square + pawnDir + side;
      if (onBoard(from) && this.board[from] === bySide * PAWN) {
        return true;
      }
    }

    for (const delta of KNIGHT_DELTAS) {
      const from = square + delta;
      if (onBoard(from) && this.board[from] === bySide * KNIGHT) {
        return true;
      }
    }

    for (const delta of KING_DELTAS) {
      const from = square + delta;
      if (onBoard(from) && this.board[from] === bySide * KING) {
        return true;
      }
    }

    const slide = (deltas, pieces) => {
      for (const delta of deltas) {
        let from = square + delta;
        while (onBoard(from)) {
          const piece = this.board[from];
          if (piece !== EMPTY) {
            if (piece * bySide > 0 && pieces.includes(Math.abs(piece))) {
              return true;
            }
            break;
          }
          from += delta;
        }
      }
      return false;
    };

    if (slide(BISHOP_DELTAS, [BISHOP, QUEEN])) return true;
    if (slide(ROOK_DELTAS, [ROOK, QUEEN])) return true;
    return false;
  }

  inCheck(colour = this.side) {
    return this.isAttacked(this.kingSquare(colour), -colour);
  }

  /** Every pseudo-legal move for the side to move. */
  generatePseudoMoves() {
    const moves = [];
    const us = this.side;

    for (let from = 0; from < 128; from += 1) {
      if (!onBoard(from)) {
        from += 7;
        continue;
      }
      const piece = this.board[from];
      if (piece === EMPTY || piece * us < 0) continue;

      const type = Math.abs(piece);

      if (type === PAWN) {
        const forward = us === WHITE ? -16 : 16;
        const startRank = us === WHITE ? 6 : 1;
        const promoRank = us === WHITE ? 0 : 7;

        const one = from + forward;
        if (onBoard(one) && this.board[one] === EMPTY) {
          if (rankOf(one) === promoRank) {
            for (const promo of [QUEEN, ROOK, BISHOP, KNIGHT]) {
              moves.push({ from, to: one, promotion: promo });
            }
          } else {
            moves.push({ from, to: one });
            const two = from + forward * 2;
            if (rankOf(from) === startRank && this.board[two] === EMPTY) {
              moves.push({ from, to: two, double: true });
            }
          }
        }

        for (const side of [-1, 1]) {
          const to = from + forward + side;
          if (!onBoard(to)) continue;
          const target = this.board[to];
          if (target !== EMPTY && target * us < 0) {
            if (rankOf(to) === promoRank) {
              for (const promo of [QUEEN, ROOK, BISHOP, KNIGHT]) {
                moves.push({ from, to, promotion: promo });
              }
            } else {
              moves.push({ from, to });
            }
          } else if (to === this.ep && target === EMPTY) {
            moves.push({ from, to, enPassant: true });
          }
        }
        continue;
      }

      const deltas =
        type === KNIGHT
          ? KNIGHT_DELTAS
          : type === BISHOP
            ? BISHOP_DELTAS
            : type === ROOK
              ? ROOK_DELTAS
              : KING_DELTAS;
      const sliding = type === BISHOP || type === ROOK || type === QUEEN;
      const rays = type === QUEEN ? BISHOP_DELTAS.concat(ROOK_DELTAS) : deltas;

      for (const delta of rays) {
        let to = from + delta;
        while (onBoard(to)) {
          const target = this.board[to];
          if (target === EMPTY) {
            moves.push({ from, to });
          } else {
            if (target * us < 0) moves.push({ from, to });
            break;
          }
          if (!sliding) break;
          to += delta;
        }
      }

      if (type === KING) {
        const rank = us === WHITE ? 7 : 0;
        const kingSide = us === WHITE ? WK : BK;
        const queenSide = us === WHITE ? WQ : BQ;
        const e = rank * 16 + 4;

        if (
          this.castling & kingSide &&
          this.board[e + 1] === EMPTY &&
          this.board[e + 2] === EMPTY &&
          !this.isAttacked(e, -us) &&
          !this.isAttacked(e + 1, -us) &&
          !this.isAttacked(e + 2, -us)
        ) {
          moves.push({ from: e, to: e + 2, castle: "K" });
        }
        if (
          this.castling & queenSide &&
          this.board[e - 1] === EMPTY &&
          this.board[e - 2] === EMPTY &&
          this.board[e - 3] === EMPTY &&
          !this.isAttacked(e, -us) &&
          !this.isAttacked(e - 1, -us) &&
          !this.isAttacked(e - 2, -us)
        ) {
          moves.push({ from: e, to: e - 2, castle: "Q" });
        }
      }
    }

    return moves;
  }

  /** Pseudo-legal moves filtered down to those that leave our king safe. */
  generateMoves() {
    const legal = [];
    for (const move of this.generatePseudoMoves()) {
      this.makeMove(move);
      if (!this.isAttacked(this.kingSquare(-this.side), this.side)) {
        legal.push(move);
      }
      this.unmakeMove();
    }
    return legal;
  }

  makeMove(move) {
    const us = this.side;
    const piece = this.board[move.from];
    const captured = move.enPassant
      ? this.board[move.to + (us === WHITE ? 16 : -16)]
      : this.board[move.to];

    this.history.push({
      move,
      captured,
      castling: this.castling,
      ep: this.ep,
    });

    this.board[move.to] = move.promotion ? us * move.promotion : piece;
    this.board[move.from] = EMPTY;

    if (move.enPassant) {
      this.board[move.to + (us === WHITE ? 16 : -16)] = EMPTY;
    }

    if (move.castle) {
      const rank = us === WHITE ? 7 : 0;
      if (move.castle === "K") {
        this.board[rank * 16 + 5] = this.board[rank * 16 + 7];
        this.board[rank * 16 + 7] = EMPTY;
      } else {
        this.board[rank * 16 + 3] = this.board[rank * 16 + 0];
        this.board[rank * 16 + 0] = EMPTY;
      }
    }

    this.ep = move.double ? move.from + (us === WHITE ? -16 : 16) : -1;

    // Castling rights are lost when a king or rook leaves, or a rook is taken.
    if (Math.abs(piece) === KING) {
      this.castling &= us === WHITE ? ~(WK | WQ) : ~(BK | BQ);
    }
    const clearRookRights = (square) => {
      if (square === 0x70) this.castling &= ~WQ;
      if (square === 0x77) this.castling &= ~WK;
      if (square === 0x00) this.castling &= ~BQ;
      if (square === 0x07) this.castling &= ~BK;
    };
    clearRookRights(move.from);
    clearRookRights(move.to);

    this.side = -us;
  }

  unmakeMove() {
    const entry = this.history.pop();
    if (!entry) return;
    const { move, captured, castling, ep } = entry;

    this.side = -this.side;
    const us = this.side;

    this.board[move.from] = move.promotion ? us * PAWN : this.board[move.to];
    this.board[move.to] = EMPTY;

    if (move.enPassant) {
      this.board[move.to + (us === WHITE ? 16 : -16)] = captured;
    } else {
      this.board[move.to] = captured;
    }

    if (move.castle) {
      const rank = us === WHITE ? 7 : 0;
      if (move.castle === "K") {
        this.board[rank * 16 + 7] = this.board[rank * 16 + 5];
        this.board[rank * 16 + 5] = EMPTY;
      } else {
        this.board[rank * 16 + 0] = this.board[rank * 16 + 3];
        this.board[rank * 16 + 3] = EMPTY;
      }
    }

    this.castling = castling;
    this.ep = ep;
  }

  clone() {
    const copy = new Position();
    copy.board = Int8Array.from(this.board);
    copy.side = this.side;
    copy.castling = this.castling;
    copy.ep = this.ep;
    copy.history = [];
    return copy;
  }
}

/** Count leaf nodes to `depth`. The move generator's correctness proof. */
export function perft(position, depth) {
  if (depth === 0) return 1;
  let nodes = 0;
  for (const move of position.generateMoves()) {
    position.makeMove(move);
    nodes += perft(position, depth - 1);
    position.unmakeMove();
  }
  return nodes;
}
