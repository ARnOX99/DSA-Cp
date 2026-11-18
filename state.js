// --- Stage 2: application state, independent of the DOM (testable in Node) ---
// Holds: agents (hash table keyed by id), orders (hash table keyed by id),
// the FIFO queue of waiting orders, the order cap, and per-step snapshots.

if (typeof module !== 'undefined') {
  var { dijkstraAll, pathToRoot } = require('./dijkstra.js');
}

// max number of orders a user can place in one session (until Reset all)
const ORDER_LIMIT = 8;

// ---------- FIFO queue: singly linked list, head + tail pointers ----------
// enqueue (at tail) and dequeue (at head) are both O(1).
class OrderQueue {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  enqueue(orderId) {
    const node = { orderId: orderId, next: null };
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.size++;
  }

  dequeue() {
    if (this.head === null) return null;
    const orderId = this.head.orderId;
    this.head = this.head.next;
    if (this.head === null) this.tail = null;
    this.size--;
    return orderId;
  }

  peek() {
    return this.head === null ? null : this.head.orderId;
  }

  isEmpty() {
    return this.size === 0;
  }

  // order ids from front to back, for rendering the "Waiting orders" card
  toArray() {
    const out = [];
    let cur = this.head;
    while (cur !== null) {
      out.push(cur.orderId);
      cur = cur.next;
    }
    return out;
  }
}

// ---------- state ----------
// agent.status : 'idle' | 'to_pickup' | 'delivering'
// agent.path   : remaining nodes the agent will walk; path[0] is always its
//                current node (so [n] means "nowhere to go")
// order.status : 'waiting' | 'to_pickup' | 'delivering' | 'delivered'
function createState(cityData) {
  const agents = {};
  cityData.agents.forEach(a => {
    agents[a.id] = {
      id: a.id,
      startNodeId: a.startNodeId,
      currentNodeId: a.startNodeId,
      status: 'idle',
      orderId: null,
      path: [a.startNodeId]
    };
  });

  return {
    agents: agents,
    orders: {},
    queue: new OrderQueue(),
    nextOrderId: 1,
    ordersPlaced: 0,
    step: 0,
    snapshots: [],
    trafficEdges: []      // [{ from, to, clicks }] roads that have been jammed
  };
}

// full reset: agents go back to their start nodes (the "Reset all" button)
function resetState(state, cityData) {
  const fresh = createState(cityData);
  state.agents = fresh.agents;
  state.orders = fresh.orders;
  state.queue = fresh.queue;
  state.nextOrderId = 1;
  state.ordersPlaced = 0;
  state.step = 0;
  state.snapshots = [];
  state.trafficEdges = [];
}

// ---------- placing orders ----------
// Validates the cap, records the order and puts it at the back of the queue.
// Does NOT assign an agent -- call assignOrders() afterwards.
function placeOrder(state, pickupNodeId, dropNodeId) {
  if (state.ordersPlaced >= ORDER_LIMIT) {
    return { ok: false, reason: 'limit-reached', limit: ORDER_LIMIT };
  }

  const order = {
    id: state.nextOrderId++,
    pickupNodeId: pickupNodeId,
    dropNodeId: dropNodeId,
    status: 'waiting',
    agentId: null,
    placedStep: state.step,
    assignedStep: null,
    deliveredStep: null,
    pickupCost: null      // agent -> restaurant cost at the moment of assignment
  };

  state.orders[order.id] = order;
  state.ordersPlaced++;
  state.queue.enqueue(order.id);
  return { ok: true, order: order };
}

// ---------- assignment ----------
// Strict FIFO: only the order at the front of the queue is considered.
// One Dijkstra run from its restaurant gives the cost to every node, so the
// nearest idle agent is found from a single run. Ties go to the lower agent id.
// Repeats while there are both waiting orders and idle agents.
// Returns the list of assignments made: [{ orderId, agentId, pickupCost, path }]
function assignOrders(state, adj) {
  const made = [];

  while (!state.queue.isEmpty()) {
    const idleAgents = Object.values(state.agents)
      .filter(a => a.status === 'idle')
      .sort((a, b) => a.id - b.id);
    if (idleAgents.length === 0) break;

    const order = state.orders[state.queue.peek()];
    const result = dijkstraAll(adj, order.pickupNodeId);

    let best = null;
    idleAgents.forEach(a => {
      const d = result.dist[a.currentNodeId];
      if (d !== Infinity && (best === null || d < best.cost)) {
        best = { agent: a, cost: d };
      }
    });

    // no idle agent can reach this restaurant: leave the order at the front
    // and stop (FIFO -- later orders must not jump ahead)
    if (best === null) break;

    state.queue.dequeue();

    // pathToRoot follows parents from the agent's node back to the restaurant,
    // so it already runs agent -> ... -> restaurant (no reversing needed)
    const path = pathToRoot(result.parent, best.agent.currentNodeId);

    best.agent.status = 'to_pickup';
    best.agent.orderId = order.id;
    best.agent.path = path;

    order.status = 'to_pickup';
    order.agentId = best.agent.id;
    order.assignedStep = state.step;
    order.pickupCost = best.cost;

    made.push({ orderId: order.id, agentId: best.agent.id, pickupCost: best.cost, path: path.slice() });
  }

  return made;
}

// ---------- snapshots (one per step) ----------
// Deep copy of everything the UI needs to redraw that moment, so any past step
// can be shown again without replaying anything.
function recordSnapshot(state, events) {
  const snap = {
    step: state.step,
    agents: JSON.parse(JSON.stringify(state.agents)),
    orders: JSON.parse(JSON.stringify(state.orders)),
    queue: state.queue.toArray(),
    trafficEdges: JSON.parse(JSON.stringify(state.trafficEdges || [])),
    events: (events || []).slice()
  };
  state.snapshots.push(snap);
  return snap;
}

function getSnapshot(state, step) {
  return state.snapshots.find(s => s.step === step) || null;
}

// ---------- small helpers for the UI ----------
function ordersLeftToPlace(state) {
  return ORDER_LIMIT - state.ordersPlaced;
}

if (typeof module !== 'undefined') {
  module.exports = {
    ORDER_LIMIT, OrderQueue, createState, resetState, placeOrder,
    assignOrders, recordSnapshot, getSnapshot, ordersLeftToPlace
  };
}
