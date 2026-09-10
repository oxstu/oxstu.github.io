// Ambient background graphics: a handful of small point clusters, each
// growing via a random walk (max 7 points, oldest dropped once the 7th
// arrives) and continuously re-triangulated with a Delaunay triangulation
// so the mesh always uses as many triangles as the point set allows.

const GRAPH_COUNT = 10;
const MAX_POINTS = 7;
const GROW_INTERVAL_MIN = 1400; // ms
const GROW_INTERVAL_MAX = 3200; // ms
const REGION_RADIUS_MIN = 90;
const REGION_RADIUS_MAX = 170;
const POINT_SPEED = 0.35;
const LIFESPAN_MIN = 18000; // ms, how long a cluster lives before dissipating
const LIFESPAN_MAX = 32000;
const FADE_DURATION = 2000; // ms, fade-out window at the end of a lifespan
const ACCENT = '122, 167, 255'; // matches --accent, as an rgb triplet

let canvas, ctx;
let graphs = [];
let rafId = null;
let running = false;

class MiniGraph {
  constructor(cx, cy, radius, now) {
    this.cx = cx;
    this.cy = cy;
    this.radius = radius;
    this.points = [this.spawnPoint()];
    this.nextGrowAt = now + randomBetween(GROW_INTERVAL_MIN, GROW_INTERVAL_MAX);
    this.birth = now;
    this.lifespan = randomBetween(LIFESPAN_MIN, LIFESPAN_MAX);
  }

  fadeAlpha(now) {
    const age = now - this.birth;
    const remaining = this.lifespan - age;
    if (remaining >= FADE_DURATION) return 1;
    return Math.max(remaining / FADE_DURATION, 0);
  }

  isExpired(now) {
    return now - this.birth >= this.lifespan;
  }

  spawnPoint() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.radius * 0.6;
    return {
      x: this.cx + Math.cos(angle) * dist,
      y: this.cy + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * POINT_SPEED,
      vy: (Math.random() - 0.5) * POINT_SPEED,
    };
  }

  update(now) {
    // random walk with soft containment inside the region
    this.points.forEach((p) => {
      p.vx += (Math.random() - 0.5) * 0.06;
      p.vy += (Math.random() - 0.5) * 0.06;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > POINT_SPEED) {
        p.vx = (p.vx / speed) * POINT_SPEED;
        p.vy = (p.vy / speed) * POINT_SPEED;
      }
      p.x += p.vx;
      p.y += p.vy;

      const dx = p.x - this.cx;
      const dy = p.y - this.cy;
      const dist = Math.hypot(dx, dy);
      if (dist > this.radius) {
        // gentle pull back toward center
        p.x -= (dx / dist) * (dist - this.radius) * 0.05;
        p.y -= (dy / dist) * (dist - this.radius) * 0.05;
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
    });

    // growth: add a point, dropping the oldest once we exceed MAX_POINTS
    if (now >= this.nextGrowAt) {
      this.points.push(this.spawnPoint());
      if (this.points.length > MAX_POINTS) this.points.shift();
      this.nextGrowAt = now + randomBetween(GROW_INTERVAL_MIN, GROW_INTERVAL_MAX);
    }
  }

  draw(ctx, alpha) {
    const pts = this.points;

    if (pts.length >= 3) {
      const triangles = delaunay(pts);
      triangles.forEach(([a, b, c]) => {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.closePath();
        ctx.fillStyle = `rgba(${ACCENT}, ${0.05 * alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${ACCENT}, ${0.28 * alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    } else if (pts.length === 2) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.strokeStyle = `rgba(${ACCENT}, ${0.28 * alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ACCENT}, ${0.55 * alpha})`;
      ctx.fill();
    });
  }
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// --- minimal Bowyer-Watson Delaunay triangulation (fine for tiny point sets) ---
function delaunay(points) {
  const minX = Math.min(...points.map((p) => p.x));
  const minY = Math.min(...points.map((p) => p.y));
  const maxX = Math.max(...points.map((p) => p.x));
  const maxY = Math.max(...points.map((p) => p.y));
  const dMax = Math.max(maxX - minX, maxY - minY) * 10 + 10;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const superA = { x: midX - 2 * dMax, y: midY - dMax };
  const superB = { x: midX, y: midY + 2 * dMax };
  const superC = { x: midX + 2 * dMax, y: midY - dMax };

  let triangles = [[superA, superB, superC]];

  points.forEach((p) => {
    const edges = [];
    triangles = triangles.filter(([a, b, c]) => {
      if (inCircumcircle(p, a, b, c)) {
        edges.push([a, b], [b, c], [c, a]);
        return false;
      }
      return true;
    });

    const uniqueEdges = edges.filter(
      (edge, i) => !edges.some((other, j) => i !== j && sameEdge(edge, other))
    );

    uniqueEdges.forEach(([a, b]) => triangles.push([a, b, p]));
  });

  return triangles.filter(
    (tri) => !tri.some((v) => v === superA || v === superB || v === superC)
  );
}

function inCircumcircle(p, a, b, c) {
  // The in-circle test below only gives the right answer if a, b, c are
  // wound counter-clockwise. Detect the winding and swap if needed so the
  // test is correct regardless of how the triangle was built.
  const orientation = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  let A = a, B = b, C = c;
  if (orientation < 0) {
    B = c;
    C = b;
  }

  const ax = A.x - p.x, ay = A.y - p.y;
  const bx = B.x - p.x, by = B.y - p.y;
  const cx = C.x - p.x, cy = C.y - p.y;
  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);
  return det > 0;
}

function sameEdge(e1, e2) {
  return (e1[0] === e2[0] && e1[1] === e2[1]) || (e1[0] === e2[1] && e1[1] === e2[0]);
}

// --- setup / lifecycle ---
function docHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = docHeight();
}

function spawnGraph(now) {
  const radius = randomBetween(REGION_RADIUS_MIN, REGION_RADIUS_MAX);
  const cx = randomBetween(radius, canvas.width - radius);
  const cy = randomBetween(radius, canvas.height - radius);
  return new MiniGraph(cx, cy, radius, now);
}

function seedGraphs(now) {
  graphs = [];
  for (let i = 0; i < GRAPH_COUNT; i++) {
    graphs.push(spawnGraph(now));
  }
}

function tick(now) {
  if (!running) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  graphs.forEach((g, i) => {
    if (g.isExpired(now)) {
      graphs[i] = spawnGraph(now);
      return;
    }
    g.update(now);
    g.draw(ctx, g.fadeAlpha(now));
  });
  rafId = requestAnimationFrame(tick);
}

function startGraphs() {
  if (running) return;
  running = true;
  resizeCanvas();
  seedGraphs(performance.now());
  canvas.classList.add('graphs-active');
  rafId = requestAnimationFrame(tick);
}

function stopGraphs() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  canvas.classList.remove('graphs-active');
}

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('graphsCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const graphsBtn = document.getElementById('graphsToggle');
  if (!graphsBtn) return;

  graphsBtn.addEventListener('click', () => {
    const nowActive = graphsBtn.classList.toggle('active');
    if (nowActive) {
      startGraphs();
    } else {
      stopGraphs();
    }
  });
});
