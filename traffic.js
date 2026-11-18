// --- Stage 3: live traffic + reroute of every affected agent. Pure logic. ---

if (typeof module !== 'undefined') {
  var { dijkstraJS } = require('./dijkstra.js');
  var { planDropPath, commitSnapshot } = require('./steps.js');
}

// the road directly ahead of an agent, or null (idle / on its last node)
function getNextEdgeAhead(agent) {
  if (agent.status === 'idle' || agent.path.length < 2) return null;
  return { from: agent.path[0], to: agent.path[1] };
}

function bumpEdgeWeight(adj, fromId, toId, multiplier) {
  adj[fromId].forEach(e => { if (e.to === toId) e.weight *= multiplier; });
  adj[toId].forEach(e => { if (e.to === fromId) e.weight *= multiplier; });
}

// does the agent's remaining path walk along this road (either direction)?
function pathUsesEdge(path, a, b) {
  for (let i = 0; i + 1 < path.length; i++) {
    if ((path[i] === a && path[i + 1] === b) || (path[i] === b && path[i + 1] === a)) return true;
  }
  return false;
}

function samePath(p, q) {
  return p.length === q.length && p.every((n, i) => n === q[i]);
}

// Agents that currently have a road ahead (for the drop-down).
function trafficCandidates(agents) {
  return Object.values(agents)
    .filter(a => getNextEdgeAhead(a) !== null)
    .sort((x, y) => x.id - y.id);
}

// Jams the road ahead of the chosen agent (weight x multiplier, stacking on
// repeated clicks), then reroutes EVERY agent whose remaining path uses it.
// Returns { success, edge, rerouted:[ids], kept:[ids], failed:[ids] }.
function applyTraffic(state, adj, cityData, agentId, multiplier) {
  const chosen = state.agents[agentId];
  const edge = chosen ? getNextEdgeAhead(chosen) : null;
  if (!edge) return { success: false, reason: 'no-road-ahead' };

  bumpEdgeWeight(adj, edge.from, edge.to, multiplier || 10);

  const rec = state.trafficEdges.find(t =>
    (t.from === edge.from && t.to === edge.to) || (t.from === edge.to && t.to === edge.from));
  if (rec) rec.clicks++;
  else state.trafficEdges.push({ from: edge.from, to: edge.to, clicks: 1 });

  const events = [{
    type: 'traffic',
    text: 'Traffic on road ' + edge.from + '-' + edge.to + ' (placed ahead of Agent ' + agentId + ')'
  }];

  const rerouted = [], kept = [], failed = [];

  Object.values(state.agents).sort((a, b) => a.id - b.id).forEach(agent => {
    if (agent.status === 'idle' || !pathUsesEdge(agent.path, edge.from, edge.to)) return;
    const order = state.orders[agent.orderId];
    const target = agent.status === 'to_pickup' ? order.pickupNodeId : order.dropNodeId;
    const route = dijkstraJS(adj, agent.currentNodeId, target);

    if (!route.found) {
      failed.push(agent.id);
      events.push({ type: 'traffic', agentId: agent.id,
        text: 'Agent ' + agent.id + ' has no other route and keeps its path' });
    } else if (samePath(route.path, agent.path)) {
      kept.push(agent.id);
      events.push({ type: 'reroute', agentId: agent.id,
        text: 'Agent ' + agent.id + ' recalculated: its route is still the cheapest' });
    } else {
      agent.path = route.path;
      order.rerouted = (order.rerouted || 0) + 1;
      rerouted.push(agent.id);
      events.push({ type: 'reroute', agentId: agent.id,
        text: 'Agent ' + agent.id + ' rerouted (order O' + order.id + '), ' +
              (route.path.length - 1) + ' roads left' });
    }
  });

  // the restaurant -> drop leg of agents still heading to pickup is now stale
  Object.values(state.orders).forEach(order => {
    if (order.status === 'to_pickup') planDropPath(state, order, adj, cityData);
  });

  commitSnapshot(state, events);
  return { success: true, edge: edge, rerouted: rerouted, kept: kept, failed: failed };
}

if (typeof module !== 'undefined') {
  module.exports = { getNextEdgeAhead, bumpEdgeWeight, pathUsesEdge, trafficCandidates, applyTraffic };
}
