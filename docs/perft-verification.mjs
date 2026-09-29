import { Position, perft } from "../js/chess/engine.js";

const suites = [
  { name: "startpos", fen: undefined, expect: [20, 400, 8902, 197281] },
  {
    name: "kiwipete",
    fen: "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    expect: [48, 2039, 97862],
  },
  {
    name: "position3 (ep/pins)",
    fen: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
    expect: [14, 191, 2812, 43238],
  },
  {
    name: "position4 (promotions)",
    fen: "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
    expect: [6, 264, 9467],
  },
  {
    name: "position5",
    fen: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
    expect: [44, 1486, 62379],
  },
];

let allPass = true;
for (const s of suites) {
  const p = new Position(s.fen);
  const out = [];
  for (let d = 1; d <= s.expect.length; d++) {
    const t0 = Date.now();
    const got = perft(p, d);
    const want = s.expect[d - 1];
    const ok = got === want;
    if (!ok) allPass = false;
    out.push(
      `d${d}: ${got}${ok ? " ✓" : ` ✗ (want ${want})`} ${Date.now() - t0}ms`
    );
  }
  console.log(`${s.name.padEnd(24)} ${out.join("  ")}`);
}
console.log(
  allPass
    ? "\nALL PERFT TESTS PASS"
    : "\nPERFT FAILURES — move generator is wrong"
);
process.exit(allPass ? 0 : 1);
