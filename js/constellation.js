/**
 * Skill Constellation — the creative addition.
 *
 * A force-directed graph written from scratch on a 2D canvas, with no graphing
 * library. Layout uses the Fruchterman-Reingold formulation: every pair of
 * nodes repels with k^2/d, every edge attracts with d^2/k, and a cooling
 * "temperature" caps how far a node may move each step so the graph settles
 * instead of oscillating. k is derived from the canvas area and node count, so
 * the same code lays out sensibly on a phone and on a wide desktop without any
 * hand-tuned constants.
 *
 * Selecting a node dims everything it is not connected to, which turns the
 * question "where has this person actually used Kubernetes?" into one click.
 * The graph is decorative on its own, so every node is also reachable from a
 * real <button> list that this module keeps in sync.
 */

const RADIUS = {
  skill: 7,
  experience: 11,
  project: 9,
  publication: 8,
};

const COLOR = {
  skill: "#5eead4",
  experience: "#818cf8",
  project: "#f472b6",
  publication: "#fbbf24",
};

/** Ideal edge length as a fraction of the space available per node. */
const K_SCALE = 0.62;
/** Weak pull toward the middle, so nothing drifts into a corner. */
const CENTERING = 0.012;
/** Temperature decay per step. */
const COOLING = 0.975;
/** Iterations used when animation is switched off. */
const SETTLE_STEPS = 500;

/**
 * Build the node and edge lists from the site's content.
 *
 * @param {Array} skills Skill descriptors.
 * @param {Array} work Work descriptors carrying skill ids.
 * @returns {{nodes: Array, edges: Array}} Graph ready for simulation.
 */
function buildGraph(skills, work) {
  const nodes = [];
  const index = new Map();

  skills.forEach((skill) => {
    const node = {
      id: skill.id,
      label: skill.label,
      type: "skill",
      data: skill,
    };
    index.set(node.id, node);
    nodes.push(node);
  });

  work.forEach((item) => {
    const node = {
      id: item.id,
      label: item.title,
      type: item.kind,
      data: item,
    };
    index.set(node.id, node);
    nodes.push(node);
  });

  const edges = [];
  work.forEach((item) => {
    item.skills.forEach((skillId) => {
      const from = index.get(item.id);
      const to = index.get(skillId);
      if (from && to) {
        edges.push({ from, to });
      }
    });
  });

  nodes.forEach((node) => {
    node.neighbors = new Set();
    node.degree = 0;
  });
  edges.forEach((edge) => {
    edge.from.neighbors.add(edge.to);
    edge.to.neighbors.add(edge.from);
    edge.from.degree += 1;
    edge.to.degree += 1;
  });

  return { nodes, edges };
}

/** Ideal distance between two connected nodes for this canvas. */
function idealDistance(width, height, count) {
  return K_SCALE * Math.sqrt((width * height) / Math.max(count, 1));
}

/**
 * Seed positions on two concentric rings. Deterministic on purpose: the layout
 * looks the same on every visit instead of shuffling on reload.
 */
function seedPositions(nodes, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const skillNodes = nodes.filter((node) => node.type === "skill");
  const workNodes = nodes.filter((node) => node.type !== "skill");

  const place = (list, radius) => {
    list.forEach((node, i) => {
      const angle = (i / Math.max(list.length, 1)) * Math.PI * 2;
      node.x = cx + Math.cos(angle) * radius;
      node.y = cy + Math.sin(angle) * radius;
    });
  };

  place(skillNodes, Math.min(width, height) * 0.2);
  place(workNodes, Math.min(width, height) * 0.38);
}

/**
 * Advance the layout one Fruchterman-Reingold step.
 *
 * @param {Array} nodes Graph nodes, mutated in place.
 * @param {Array} edges Graph edges.
 * @param {number} width Canvas width in CSS pixels.
 * @param {number} height Canvas height in CSS pixels.
 * @param {number} temperature Maximum distance a node may move this step.
 * @returns {number} Total distance moved, used to decide when to stop.
 */
function step(nodes, edges, width, height, temperature) {
  const k = idealDistance(width, height, nodes.length);

  nodes.forEach((node) => {
    node.dx = 0;
    node.dy = 0;
  });

  // Repulsion between every pair.
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      // Nudge coincident nodes apart so the division stays finite.
      if (distance < 0.01) {
        dx = (i % 2 === 0 ? 1 : -1) * 0.1;
        dy = 0.1;
        distance = 0.14;
      }

      const force = (k * k) / distance;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      a.dx += fx;
      a.dy += fy;
      b.dx -= fx;
      b.dy -= fy;
    }
  }

  // Attraction along edges.
  edges.forEach((edge) => {
    const dx = edge.from.x - edge.to.x;
    const dy = edge.from.y - edge.to.y;
    const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 0.01);
    const force = (distance * distance) / k;
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;

    edge.from.dx -= fx;
    edge.from.dy -= fy;
    edge.to.dx += fx;
    edge.to.dy += fy;
  });

  const cx = width / 2;
  const cy = height / 2;
  let moved = 0;

  nodes.forEach((node) => {
    node.dx += (cx - node.x) * CENTERING * k;
    node.dy += (cy - node.y) * CENTERING * k;

    // Move at most `temperature` pixels, in the direction of the net force.
    const length = Math.sqrt(node.dx * node.dx + node.dy * node.dy) || 0.01;
    const travel = Math.min(length, temperature);
    node.x += (node.dx / length) * travel;
    node.y += (node.dy / length) * travel;

    // Keep nodes clear of the frame so their labels stay readable.
    const margin = RADIUS[node.type] + 22;
    node.x = Math.min(width - margin, Math.max(margin, node.x));
    node.y = Math.min(height - margin, Math.max(margin, node.y));

    moved += travel;
  });

  return moved;
}

/**
 * Mount the constellation.
 *
 * @param {object} options Configuration.
 * @param {HTMLCanvasElement} options.canvas Canvas to draw into.
 * @param {HTMLElement} options.list Container for the accessible button list.
 * @param {Array} options.skills Skill descriptors.
 * @param {Array} options.work Work descriptors.
 * @param {Function} options.onSelect Called with the selected node's data.
 * @returns {{select: Function, destroy: Function}} Controls for the caller.
 */
export function createConstellation({ canvas, list, skills, work, onSelect }) {
  const context = canvas.getContext("2d");
  const { nodes, edges } = buildGraph(skills, work);

  let width = canvas.clientWidth || 640;
  let height = canvas.clientHeight || 420;
  let selected = null;
  let hovered = null;
  let frame = null;
  let running = true;
  let temperature = 0;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function startingTemperature() {
    return Math.min(width, height) / 8;
  }

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = canvas.clientWidth || width;
    height = canvas.clientHeight || height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  /** Node radius, grown a little by how connected the node is. */
  function nodeRadius(node) {
    return RADIUS[node.type] + Math.min(node.degree, 5);
  }

  /** True when a node should be drawn at full strength. */
  function isActive(node) {
    const focus = hovered || selected;
    if (!focus) {
      return true;
    }
    return node === focus || focus.neighbors.has(node);
  }

  /**
   * Label pass, run after the circles so text always sits on top.
   *
   * Labelling all 23 nodes at once turns the graph into soup, so labels are
   * drawn in priority order and any that would collide with one already drawn
   * is skipped. Highest priority wins the space.
   */
  function drawLabels(focus) {
    context.font = "500 12px system-ui, -apple-system, sans-serif";
    context.textAlign = "center";

    const priority = (node) => {
      if (node === focus) {
        return 0;
      }
      if (focus && focus.neighbors.has(node)) {
        return 1;
      }
      if (focus) {
        return 9;
      }
      if (node.degree >= 4) {
        return 2;
      }
      return node.type === "skill" ? 9 : 3;
    };

    const candidates = nodes
      .map((node) => ({ node, rank: priority(node) }))
      .filter((entry) => entry.rank < 4)
      .sort((a, b) => a.rank - b.rank || b.node.degree - a.node.degree);

    const drawn = [];

    candidates.forEach(({ node }) => {
      const text =
        node.label.length > 26 ? node.label.slice(0, 25) + "..." : node.label;
      const textWidth = context.measureText(text).width;
      const x = Math.min(
        width - textWidth / 2 - 4,
        Math.max(textWidth / 2 + 4, node.x)
      );
      const y = node.y - nodeRadius(node) - 7;
      const box = {
        left: x - textWidth / 2 - 3,
        right: x + textWidth / 2 + 3,
        top: y - 12,
        bottom: y + 4,
      };

      const collides = drawn.some(
        (other) =>
          box.left < other.right &&
          box.right > other.left &&
          box.top < other.bottom &&
          box.bottom > other.top
      );
      if (collides) {
        return;
      }
      drawn.push(box);

      // A dark pad behind the text keeps it readable where edges cross it.
      context.globalAlpha = 0.72;
      context.fillStyle = "#0b1020";
      context.fillRect(
        box.left,
        box.top,
        box.right - box.left,
        box.bottom - box.top
      );

      context.globalAlpha = 1;
      context.fillStyle = node === focus ? "#f8fafc" : "#cbd5e1";
      context.fillText(text, x, y);
    });

    context.globalAlpha = 1;
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    const focus = hovered || selected;

    edges.forEach((edge) => {
      const lit = !focus || edge.from === focus || edge.to === focus;
      context.strokeStyle = lit
        ? "rgba(148, 163, 184, 0.5)"
        : "rgba(148, 163, 184, 0.09)";
      context.lineWidth = lit ? 1.3 : 0.7;
      context.beginPath();
      context.moveTo(edge.from.x, edge.from.y);
      context.lineTo(edge.to.x, edge.to.y);
      context.stroke();
    });

    nodes.forEach((node) => {
      const active = isActive(node);
      const radius = nodeRadius(node);

      context.globalAlpha = active ? 1 : 0.2;
      context.fillStyle = COLOR[node.type];
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fill();

      if (node === focus) {
        context.strokeStyle = "#f8fafc";
        context.lineWidth = 2.5;
        context.stroke();
      }

      context.globalAlpha = 1;
    });

    drawLabels(focus);
  }

  function tick() {
    if (!running) {
      return;
    }
    const moved = step(nodes, edges, width, height, temperature);
    temperature = Math.max(temperature * COOLING, 0.25);
    draw();

    // Stop once the layout is effectively still; any interaction redraws, and
    // a resize restarts the cooling schedule.
    if (moved > nodes.length * 0.35) {
      frame = window.requestAnimationFrame(tick);
    } else {
      frame = null;
    }
  }

  function kick() {
    temperature = startingTemperature();
    if (!frame && running) {
      frame = window.requestAnimationFrame(tick);
    }
  }

  function settleSilently() {
    temperature = startingTemperature();
    for (let i = 0; i < SETTLE_STEPS; i += 1) {
      step(nodes, edges, width, height, temperature);
      temperature = Math.max(temperature * COOLING, 0.25);
    }
    draw();
  }

  /** Nearest node to a point, within a generous touch radius. */
  function nodeAt(x, y) {
    let best = null;
    let bestDistance = Infinity;
    nodes.forEach((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = nodeRadius(node) + 12;
      if (distance < hitRadius && distance < bestDistance) {
        best = node;
        bestDistance = distance;
      }
    });
    return best;
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function select(nodeOrId) {
    const node =
      typeof nodeOrId === "string"
        ? nodes.find((candidate) => candidate.id === nodeOrId)
        : nodeOrId;

    selected = node || null;

    list.querySelectorAll("button").forEach((button) => {
      const isCurrent =
        Boolean(selected) && button.dataset.nodeId === selected.id;
      button.setAttribute("aria-pressed", String(isCurrent));
      button.classList.toggle("is-selected", isCurrent);
    });

    if (onSelect) {
      onSelect(
        selected ? selected.data : null,
        selected ? selected.type : null
      );
    }
    draw();
  }

  function handleMove(event) {
    const { x, y } = pointerPosition(event);
    const found = nodeAt(x, y);
    if (found !== hovered) {
      hovered = found;
      canvas.style.cursor = found ? "pointer" : "default";
      draw();
    }
  }

  function handleLeave() {
    if (hovered) {
      hovered = null;
      canvas.style.cursor = "default";
      draw();
    }
  }

  function handleClick(event) {
    const { x, y } = pointerPosition(event);
    const found = nodeAt(x, y);
    // Clicking empty space, or the selected node again, clears the filter.
    select(found === selected ? null : found);
  }

  // The button list is the keyboard and screen-reader path to the same data.
  function buildList() {
    const sorted = [...nodes].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "skill" ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });

    list.innerHTML = "";
    sorted.forEach((node) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = `constellation-chip chip-${node.type}`;
      button.dataset.nodeId = node.id;
      button.setAttribute("aria-pressed", "false");
      button.textContent = node.label;
      button.addEventListener("click", () => {
        select(node === selected ? null : node);
      });
      item.appendChild(button);
      list.appendChild(item);
    });
  }

  const observer = new ResizeObserver(() => {
    const previousWidth = width;
    resize();
    // A meaningful width change invalidates the layout: reseed and re-settle.
    if (Math.abs(previousWidth - width) > 40) {
      seedPositions(nodes, width, height);
      if (reduceMotion) {
        settleSilently();
      } else {
        kick();
      }
    } else {
      draw();
    }
  });

  resize();
  seedPositions(nodes, width, height);
  buildList();

  if (reduceMotion) {
    settleSilently();
  } else {
    kick();
  }

  canvas.addEventListener("pointermove", handleMove);
  canvas.addEventListener("pointerleave", handleLeave);
  canvas.addEventListener("click", handleClick);
  observer.observe(canvas);

  return {
    select,
    destroy() {
      running = false;
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      observer.disconnect();
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerleave", handleLeave);
      canvas.removeEventListener("click", handleClick);
    },
  };
}
