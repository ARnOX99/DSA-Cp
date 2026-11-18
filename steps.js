// --- Stage 3: step engine. Pure logic, no DOM (testable in Node). ---
// One step = every busy agent does ONE action (move one node, pick up, or
// deliver), then waiting orders are assigned to idle agents (FIFO).
// Agents keep their position between orders; there is no return to a start node.

if (typeof module !== 'undefined') {
  var { dijkstraJS } = require('./dijkstra.js');
  var { assignOrders, recordSnapshot } = require('./state.js');
}

function pickupNameAt(cityData, nodeId) {
  const p = cityData.pickups.find(x => x.nodeId === nodeId);
  return p ? p.name : 'node ' + nodeId;
}

function dropNameAt(cityData, nodeId) {
  const d = cityData.drops.find(x => x.nodeId === nodeId);
  return d ? d.name : 'node ' + nodeId;
}

// Restaurant -> drop route for an order. With no traffic anywhere, the C
// engine's precomputed pickupToDropRoutes is used. Once any road is jammed the
// precomputed table is stale, so the route is computed live.
function planDropPath(state, order, adj, cityData) {
  if (state.trafficEdges.length === 0) {
    const pi = cityData.pickups.findIndex(p => p.nodeId === order.pickupNodeId);
    const di = cityData.drops.findIndex(d => d.nodeId === order.dropNodeId);
    const pre = (pi >= 0 && di >= 0) ? cityData.pickupToDropRoutes[pi][di] : null;
    if (pre && pre.found !== false) {
      order.dropPath = pre.path.slice();
      order.dropCost = pre.cost;
      return;
    }
  }
  const live = dijkstraJS(adj, order.pickupNodeId, order.dropNodeId);
  order.dropPath = live.found ? live.path : [];
  order.dropCost = live.found ? live.cost : Infinity;
}

// assignOrders() from state.js, plus the planned restaurant -> drop leg and
// the log events. Returns the events.
function assignAndPlan(state, adj, cityData) {
  const made = assignOrders(state, adj);
  const events = [];
  made.forEach(m => {
    const order = state.orders[m.orderId];
    order.rerouted = 0;
    planDropPath(state, order, adj, cityData);
    events.push({
      type: 'assign',
      agentId: m.agentId,
      text: 'Order O' + order.id + ' assigned to Agent ' + m.agentId +
            ' (pickup cost ' + m.pickupCost.toFixed(2) + ')'
    });
  });
  return events;
}

// Replaces the snapshot of the current step if there is one (a user action
// between two steps belongs to that step), otherwise records a new one.
function commitSnapshot(state, newEvents) {
  const last = state.snapshots[state.snapshots.length - 1];
  if (last && last.step === state.step) {
    const merged = last.events.concat(newEvents || []);
    state.snapshots.pop();
    return recordSnapshot(state, merged);
  }
  return recordSnapshot(state, newEvents || []);
}

// Places an order and assigns it if an agent is free. Returns
// { ok, order, events } or { ok:false, reason }.
function submitOrder(state, adj, cityData, placeOrderFn, pickupNodeId, dropNodeId) {
  if (!dijkstraJS(adj, pickupNodeId, dropNodeId).found) {
    return { ok: false, reason: 'no-route' };
  }
  const placed = placeOrderFn(state, pickupNodeId, dropNodeId);
  if (!placed.ok) return placed;

  const order = placed.order;
  const events = [{
    type: 'order',
    text: 'Order O' + order.id + ' placed: ' + pickupNameAt(cityData, pickupNodeId) +
          ' to ' + dropNameAt(cityData, dropNodeId)
  }];
  events.push.apply(events, assignAndPlan(state, adj, cityData));

  if (order.status === 'waiting') {
    events.push({
      type: 'queue',
      text: 'Order O' + order.id + ' is waiting in the queue (position ' +
            (state.queue.toArray().indexOf(order.id) + 1) + ')'
    });
  }
  commitSnapshot(state, events);
  return { ok: true, order: order, events: events };
}

// true while something can still happen on the next step
function canAdvance(state) {
  return Object.values(state.agents).some(a => a.status !== 'idle');
}

function advanceStep(state, adj, cityData) {
  state.step++;
  const events = [];

  Object.values(state.agents).sort((a, b) => a.id - b.id).forEach(agent => {
    if (agent.status === 'idle') return;
    const order = state.orders[agent.orderId];

    if (agent.path.length > 1) {
      agent.path.shift();
      agent.currentNodeId = agent.path[0];
      events.push({
        type: 'move', agentId: agent.id,
        text: 'Agent ' + agent.id + ' moving to node ' + agent.currentNodeId
      });
    } else if (agent.status === 'to_pickup') {
      // standing on the restaurant node: pick up and start the second leg
      if (order.dropPath.length === 0 || order.dropPath[0] !== agent.currentNodeId) {
        planDropPath(state, order, adj, cityData);
      }
      agent.status = 'delivering';
      order.status = 'delivering';
      agent.path = order.dropPath.slice();
      events.push({
        type: 'pickup', agentId: agent.id,
        text: 'Agent ' + agent.id + ' picked up order O' + order.id + ' at ' +
              pickupNameAt(cityData, order.pickupNodeId)
      });
    } else {
      // standing on the drop node: deliver, agent stays here
      order.status = 'delivered';
      order.deliveredStep = state.step;
      agent.status = 'idle';
      agent.orderId = null;
      agent.path = [agent.currentNodeId];
      events.push({
        type: 'delivered', agentId: agent.id,
        text: 'Agent ' + agent.id + ' delivered order O' + order.id + ' to ' +
              dropNameAt(cityData, order.dropNodeId)
      });
    }
  });

  // agents freed this step can take waiting orders straight away
  events.push.apply(events, assignAndPlan(state, adj, cityData));

  commitSnapshot(state, events);
  return events;
}

if (typeof module !== 'undefined') {
  module.exports = {
    pickupNameAt, dropNameAt, planDropPath, assignAndPlan,
    commitSnapshot, submitOrder, canAdvance, advanceStep
  };
}
