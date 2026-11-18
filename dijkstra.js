// --- pure graph + Dijkstra logic, framework-independent (testable outside the browser) ---
// NOTE: this is a JS "mirror" of the algorithm implemented and verified in
// pathfinder.c. It exists because agent -> pickup routes (agents keep their
// position between orders) and routes after traffic can't be precomputed.

function buildAdjacency(cityData) {
  const adj = {};
  cityData.nodes.forEach(n => { adj[n.id] = []; });
  cityData.edges.forEach(e => {
    adj[e.from].push({ to: e.to, weight: e.weight });
    adj[e.to].push({ to: e.from, weight: e.weight });   // roads are bidirectional
  });
  return adj;
}

// simple O(n^2) Dijkstra -- no heap needed here: graphs this size (~20 nodes)
// don't benefit meaningfully from a heap, and simpler code means fewer places
// for a bug to hide in this support utility.
function dijkstraJS(adj, startId, endId) {
  const nodeIds = Object.keys(adj).map(Number);
  const dist = {};
  const parent = {};
  const visited = {};

  nodeIds.forEach(id => { dist[id] = Infinity; parent[id] = -1; visited[id] = false; });
  dist[startId] = 0;

  for (let iter = 0; iter < nodeIds.length; iter++) {
    let u = -1;
    let best = Infinity;
    nodeIds.forEach(id => {
      if (!visited[id] && dist[id] < best) {
        best = dist[id];
        u = id;
      }
    });

    if (u === -1) break;
    visited[u] = true;
    if (u === endId) break;

    adj[u].forEach(edge => {
      const v = edge.to;
      const newDist = dist[u] + edge.weight;
      if (newDist < dist[v]) {
        dist[v] = newDist;
        parent[v] = u;
      }
    });
  }

  if (dist[endId] === Infinity) {
    return { found: false, cost: Infinity, path: [] };
  }

  const path = [];
  let node = endId;
  while (node !== -1) {
    path.unshift(node);
    node = parent[node];
  }

  return { found: true, cost: dist[endId], path: path };
}


// Dijkstra from ONE start node to EVERY node (no early stop). Because roads are
// two-way with symmetric weights, one run from a restaurant gives the distance
// from that restaurant to every agent's current node, so the nearest free agent
// is found with a single run instead of one run per agent.
function dijkstraAll(adj, startId) {
  const nodeIds = Object.keys(adj).map(Number);
  const dist = {};
  const parent = {};
  const visited = {};

  nodeIds.forEach(id => { dist[id] = Infinity; parent[id] = -1; visited[id] = false; });
  dist[startId] = 0;

  for (let iter = 0; iter < nodeIds.length; iter++) {
    let u = -1;
    let best = Infinity;
    nodeIds.forEach(id => {
      if (!visited[id] && dist[id] < best) { best = dist[id]; u = id; }
    });
    if (u === -1) break;
    visited[u] = true;

    adj[u].forEach(edge => {
      const newDist = dist[u] + edge.weight;
      if (newDist < dist[edge.to]) {
        dist[edge.to] = newDist;
        parent[edge.to] = u;
      }
    });
  }
  return { dist: dist, parent: parent };
}

// Follows parent pointers from nodeId up to the start node of dijkstraAll.
// Result runs nodeId -> ... -> start, e.g. agent node -> ... -> restaurant.
function pathToRoot(parent, nodeId) {
  const path = [];
  let node = nodeId;
  while (node !== -1) {
    path.push(node);
    node = parent[node];
  }
  return path;
}

if (typeof module !== 'undefined') {
  module.exports = { buildAdjacency, dijkstraJS, dijkstraAll, pathToRoot };
}