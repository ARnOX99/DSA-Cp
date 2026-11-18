// --- Stage 3: the page now runs on state.js / steps.js / traffic.js. ---
// Many orders (cap 8), FIFO queue, agents stay where they delivered, routes are
// computed live from each agent's current node, traffic reroutes every affected agent.
// The state is the single source of truth; the page is redrawn from a snapshot.

const AGENT_COLORS = ['#1f8a7a', '#d9771e', '#6b4fc9'];
const TRAFFIC_COLOR = '#c8283a';

function nodeLookup(id) {
  return cityData.nodes.find(n => n.id === id);
}

function agentColor(id) {
  return AGENT_COLORS[id % AGENT_COLORS.length];
}

// ---------- map setup ----------
let avgLat = 0, avgLng = 0;
cityData.nodes.forEach(n => { avgLat += n.lat; avgLng += n.lng; });
avgLat /= cityData.nodes.length;
avgLng /= cityData.nodes.length;

const map = L.map('map').setView([avgLat, avgLng], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

cityData.edges.forEach(edge => {
  const fromNode = nodeLookup(edge.from);
  const toNode = nodeLookup(edge.to);
  L.polyline(
    [[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]],
    { color: '#ccc', weight: 2 }
  ).addTo(map);
});

cityData.pickups.forEach((pickup, i) => {
  const node = nodeLookup(pickup.nodeId);
  L.marker([node.lat, node.lng], {
    icon: L.divIcon({ className: 'pickup-icon', html: 'P' + i, iconSize: [24, 24] })
  }).bindPopup(pickup.name).bindTooltip(pickup.name + ' (node ' + pickup.nodeId + ')').addTo(map);
});

cityData.drops.forEach((drop, i) => {
  const node = nodeLookup(drop.nodeId);
  L.marker([node.lat, node.lng], {
    icon: L.divIcon({ className: 'drop-icon', html: 'D' + i, iconSize: [24, 24] })
  }).bindPopup(drop.name).bindTooltip(drop.name + ' (node ' + drop.nodeId + ')').addTo(map);
});

const agentMarkers = {};
cityData.agents.forEach(agent => {
  const node = nodeLookup(agent.startNodeId);
  const marker = L.marker([node.lat, node.lng], {
    icon: L.divIcon({
      className: 'agent-icon',
      html: '<span class="agent-tag" style="background:' + agentColor(agent.id) + '">A' + agent.id + '</span>',
      iconSize: [30, 20]
    }),
    zIndexOffset: 500
  }).bindPopup('Agent ' + agent.id).addTo(map);
  agentMarkers[agent.id] = marker;
});

// small legend
const legend = L.control({ position: 'bottomleft' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  div.innerHTML =
    '<div><i style="background:#c8283a"></i>Restaurant (P)</div>' +
    '<div><i style="background:#457b9d"></i>Drop location (D)</div>' +
    '<div><i class="sq" style="background:' + AGENT_COLORS[0] + '"></i>Agent (A)</div>' +
    '<div><i class="bar"></i>Road with traffic</div>';
  return div;
};
legend.addTo(map);

// ---------- toast (replaces alert) ----------
let toastTimer = null;
function showToast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ---------- application state ----------
let liveAdjacency = buildAdjacency(cityData);
const appState = createState(cityData);
commitSnapshot(appState, []);          // step 0
let viewStep = 0;                      // which step the page is showing
const TRAFFIC_MULTIPLIER = 10;         // each click multiplies the road weight by 10

function pathToLatLngs(path) {
  return path.map(id => { const n = nodeLookup(id); return [n.lat, n.lng]; });
}

// per-agent route lines: bold = the route being walked, dashed = the next leg
const routeLines = {};
cityData.agents.forEach(agent => {
  const col = agentColor(agent.id);
  routeLines[agent.id] = {
    now: L.polyline([], { color: col, weight: 6, opacity: 1 }).addTo(map),
    next: L.polyline([], { color: col, weight: 3, opacity: 0.55, dashArray: '4, 8' }).addTo(map)
  };
});
const trafficLayer = L.layerGroup().addTo(map);

// ---------- selectors ----------
const pickupSelect = document.getElementById('pickupSelect');
cityData.pickups.forEach((pickup, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = pickup.name;
  pickupSelect.appendChild(opt);
});

const dropSelect = document.getElementById('dropSelect');
cityData.drops.forEach((drop, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = drop.name;
  dropSelect.appendChild(opt);
});

const startBtn = document.getElementById('startBtn');
const startHint = document.getElementById('startHint');
const trafficAgentSelect = document.getElementById('trafficAgent');
const trafficBtn = document.getElementById('trafficBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let selectedPickupMarker = null;
let selectedDropMarker = null;

function showSelectionMarker(kind, node, label) {
  const isPickup = kind === 'pickup';
  let marker = isPickup ? selectedPickupMarker : selectedDropMarker;
  if (marker) {
    marker.setLatLng([node.lat, node.lng]);
  } else {
    marker = L.marker([node.lat, node.lng], {
      icon: L.divIcon({ className: isPickup ? 'selected-pickup-icon' : 'selected-drop-icon', html: '&#128205;', iconSize: [28, 28] }),
      zIndexOffset: 1000
    }).addTo(map);
    if (isPickup) selectedPickupMarker = marker; else selectedDropMarker = marker;
  }
  marker.bindPopup(label).openPopup();
}

pickupSelect.addEventListener('change', () => {
  if (pickupSelect.value !== '') {
    const pickup = cityData.pickups[pickupSelect.value];
    showSelectionMarker('pickup', nodeLookup(pickup.nodeId), 'Pickup: ' + pickup.name);
  }
  updateNewOrderCard();
});

dropSelect.addEventListener('change', () => {
  if (dropSelect.value !== '') {
    const drop = cityData.drops[dropSelect.value];
    showSelectionMarker('drop', nodeLookup(drop.nodeId), 'Destination: ' + drop.name);
  }
  updateNewOrderCard();
});

// ---------- helpers ----------
function viewingLatest() { return viewStep === appState.step; }

function agentStatusText(agent, snap) {
  const order = agent.orderId !== null ? snap.orders[agent.orderId] : null;
  if (agent.status === 'to_pickup') {
    return { chip: 'To pickup', cls: 'pickup',
      detail: 'Order O' + order.id + ': heading to ' + pickupNameAt(cityData, order.pickupNodeId) };
  }
  if (agent.status === 'delivering') {
    return { chip: 'Delivering', cls: 'delivering',
      detail: 'Order O' + order.id + ': carrying to ' + dropNameAt(cityData, order.dropNodeId) };
  }
  return { chip: 'Idle', cls: '', detail: 'Waiting for an order' };
}

// ---------- new-order card ----------
function updateNewOrderCard() {
  const left = ordersLeftToPlace(appState);
  document.getElementById('orderCount').textContent = appState.ordersPlaced + ' of ' + ORDER_LIMIT + ' placed';

  const chosen = pickupSelect.value !== '' && dropSelect.value !== '';
  const latest = viewingLatest();
  startBtn.disabled = !chosen || left <= 0 || !latest;

  if (left <= 0) startHint.textContent = 'Order limit of ' + ORDER_LIMIT + ' reached. Use Reset all to start over.';
  else if (!latest) startHint.textContent = 'You are looking at an earlier step. Press Next until the latest step to place orders.';
  else if (!chosen) startHint.textContent = 'Choose a restaurant and a drop location. ' + left + ' order' + (left === 1 ? '' : 's') + ' left.';
  else startHint.textContent = 'The nearest idle agent is assigned, otherwise the order waits in the queue.';
}

// ---------- panel cards (all drawn from a snapshot) ----------
function renderAgentsCard(snap) {
  const list = document.getElementById('agentList');
  list.innerHTML = '';
  Object.values(snap.agents).sort((a, b) => a.id - b.id).forEach(agent => {
    const s = agentStatusText(agent, snap);
    const li = document.createElement('li');
    li.innerHTML =
      '<span class="dot" style="background:' + agentColor(agent.id) + '"></span>' +
      '<span class="agent-name">Agent ' + agent.id + ' <span style="color:var(--muted);font-weight:400">at node ' + agent.currentNodeId + '</span></span>' +
      '<span class="chip ' + s.cls + '">' + s.chip + '</span>' +
      '<span class="agent-detail">' + s.detail + '</span>';
    list.appendChild(li);
  });
}

function renderQueueCard(snap) {
  const list = document.getElementById('queueList');
  list.innerHTML = '';
  snap.queue.forEach(orderId => {
    const o = snap.orders[orderId];
    const li = document.createElement('li');
    li.textContent = 'O' + o.id + ': ' + pickupNameAt(cityData, o.pickupNodeId) + ' to ' + dropNameAt(cityData, o.dropNodeId);
    list.appendChild(li);
  });
  document.getElementById('queueEmpty').style.display = snap.queue.length === 0 ? 'block' : 'none';
}

function renderOrdersCard(snap) {
  const list = document.getElementById('orderList');
  const empty = document.getElementById('ordersEmpty');
  list.innerHTML = '';
  const orders = Object.values(snap.orders).sort((a, b) => b.id - a.id);   // newest first
  empty.style.display = orders.length === 0 ? 'block' : 'none';

  orders.forEach(o => {
    let chipText = 'Waiting', chipClass = 'queued';
    if (o.status === 'to_pickup') { chipText = 'Assigned'; chipClass = 'pickup'; }
    else if (o.status === 'delivering') { chipText = 'Picked up'; chipClass = 'delivering'; }
    else if (o.status === 'delivered') { chipText = 'Delivered'; chipClass = 'done'; }

    let meta1;
    if (o.agentId === null) {
      meta1 = 'Placed at step ' + o.placedStep + ' &middot; waiting for a free agent';
    } else {
      meta1 = 'Agent ' + o.agentId + ' &middot; to pickup ' + o.pickupCost.toFixed(2) +
              ' &middot; to drop ' + o.dropCost.toFixed(2) +
              ' &middot; total ' + (o.pickupCost + o.dropCost).toFixed(2);
    }
    let meta2 = 'Placed step ' + o.placedStep;
    if (o.assignedStep !== null) meta2 += ' &middot; assigned step ' + o.assignedStep;
    if (o.deliveredStep !== null) meta2 += ' &middot; delivered step ' + o.deliveredStep;
    if (o.rerouted) meta2 += ' &middot; rerouted ' + o.rerouted + (o.rerouted === 1 ? ' time' : ' times');

    const card = document.createElement('div');
    card.className = 'order-card' + (o.status === 'delivered' ? ' done' : '');
    card.innerHTML =
      '<div class="order-top"><span class="order-title">O' + o.id + ': ' + pickupNameAt(cityData, o.pickupNodeId) +
      ' to ' + dropNameAt(cityData, o.dropNodeId) + '</span><span class="chip ' + chipClass + '">' + chipText + '</span></div>' +
      '<div class="order-meta">' + meta1 + '</div><div class="order-meta">' + meta2 + '</div>';
    list.appendChild(card);
  });
}

function renderLog(upToStep) {
  const logDiv = document.getElementById('eventLog');
  logDiv.innerHTML = '';
  let lastEl = null;

  appState.snapshots.forEach(s => {
    if (s.step > upToStep) return;
    s.events.forEach(ev => {
      const p = document.createElement('p');
      p.textContent = 'Step ' + s.step + ' \u00B7 ' + ev.text;
      if (ev.type === 'traffic' || ev.type === 'reroute') {
        p.className = 'traffic-line';
      } else if (ev.agentId !== undefined) {
        p.style.borderLeftColor = agentColor(ev.agentId);
      } else {
        p.className = 'order-line';
      }
      if (s.step === upToStep && upToStep > 0) p.classList.add('active');
      logDiv.appendChild(p);
      lastEl = p;
    });
  });

  if (!lastEl) {
    const p = document.createElement('p');
    p.className = 'empty-line';
    p.textContent = 'Events will appear here once an order is placed.';
    logDiv.appendChild(p);
  } else {
    lastEl.scrollIntoView({ block: 'nearest' });
  }
}

// ---------- map ----------
function renderMap(snap) {
  Object.values(snap.agents).forEach(agent => {
    const node = nodeLookup(agent.currentNodeId);
    agentMarkers[agent.id].setLatLng([node.lat, node.lng]);

    const lines = routeLines[agent.id];
    if (agent.status === 'idle') {
      lines.now.setLatLngs([]);
      lines.next.setLatLngs([]);
    } else {
      lines.now.setLatLngs(pathToLatLngs(agent.path));
      const order = snap.orders[agent.orderId];
      // dashed: the restaurant -> drop leg, only while still heading to the restaurant
      lines.next.setLatLngs(agent.status === 'to_pickup' ? pathToLatLngs(order.dropPath) : []);
    }
  });

  trafficLayer.clearLayers();
  snap.trafficEdges.forEach(t => {
    const a = nodeLookup(t.from), b = nodeLookup(t.to);
    L.polyline([[a.lat, a.lng], [b.lat, b.lng]], { color: TRAFFIC_COLOR, weight: 7, dashArray: '6, 6' })
      .bindTooltip('Traffic on road ' + t.from + '-' + t.to + (t.clicks > 1 ? ' (x' + t.clicks + ')' : ''))
      .addTo(trafficLayer);
  });
}

// ---------- controls ----------
function renderControls(snap) {
  const latest = viewingLatest();
  document.getElementById('stepLabel').innerHTML =
    'Step ' + viewStep + (latest ? '' : '<small>history, latest is step ' + appState.step + '</small>');
  prevBtn.disabled = viewStep === 0;
  nextBtn.disabled = latest && !canAdvance(appState);

  // drop-down: agents that currently have a road ahead (latest step only)
  const keep = trafficAgentSelect.value;
  trafficAgentSelect.innerHTML = '';
  const cands = latest ? trafficCandidates(appState.agents) : [];
  if (cands.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = latest ? 'No agent on the road' : 'Go to the latest step';
    trafficAgentSelect.appendChild(opt);
  }
  cands.forEach(a => {
    const edge = getNextEdgeAhead(a);
    const opt = document.createElement('option');
    opt.value = a.id;
    opt.textContent = 'Agent ' + a.id + ' (road ' + edge.from + '-' + edge.to + ')';
    trafficAgentSelect.appendChild(opt);
  });
  if (cands.some(a => String(a.id) === keep)) trafficAgentSelect.value = keep;
  trafficAgentSelect.disabled = cands.length === 0;
  trafficBtn.disabled = cands.length === 0;
  trafficBtn.title = cands.length === 0 ? 'Needs an agent with a road ahead' : 'Block the road ahead of the chosen agent';
}

function render() {
  const snap = getSnapshot(appState, viewStep);
  renderMap(snap);
  renderAgentsCard(snap);
  renderQueueCard(snap);
  renderOrdersCard(snap);
  renderLog(viewStep);
  renderControls(snap);
  updateNewOrderCard();
}

// ---------- events ----------
nextBtn.addEventListener('click', () => {
  if (!viewingLatest()) {
    viewStep++;
  } else if (canAdvance(appState)) {
    advanceStep(appState, liveAdjacency, cityData);
    viewStep = appState.step;
  }
  render();
});

prevBtn.addEventListener('click', () => {
  if (viewStep > 0) { viewStep--; render(); }
});

startBtn.addEventListener('click', () => {
  const pickup = cityData.pickups[parseInt(pickupSelect.value)];
  const drop = cityData.drops[parseInt(dropSelect.value)];

  const result = submitOrder(appState, liveAdjacency, cityData, placeOrder, pickup.nodeId, drop.nodeId);
  if (!result.ok) {
    if (result.reason === 'limit-reached') showToast('Order limit of ' + result.limit + ' reached.');
    else showToast('No route from ' + pickup.name + ' to ' + drop.name + '.');
    return;
  }

  // ready for the next order
  pickupSelect.value = '';
  dropSelect.value = '';
  if (selectedPickupMarker) { map.removeLayer(selectedPickupMarker); selectedPickupMarker = null; }
  if (selectedDropMarker) { map.removeLayer(selectedDropMarker); selectedDropMarker = null; }

  viewStep = appState.step;
  render();
});

trafficBtn.addEventListener('click', () => {
  if (trafficAgentSelect.value === '') return;
  const agentId = parseInt(trafficAgentSelect.value);
  const result = applyTraffic(appState, liveAdjacency, cityData, agentId, TRAFFIC_MULTIPLIER);

  if (!result.success) {
    showToast('Could not add traffic: that agent has no road ahead.');
    return;
  }

  const n = result.rerouted.length;
  let msg = 'Traffic on road ' + result.edge.from + '-' + result.edge.to + '. ';
  if (n > 0) msg += 'Rerouted: ' + result.rerouted.map(id => 'Agent ' + id).join(', ') + '.';
  else if (result.failed.length > 0) msg += 'No other route is available.';
  else msg += 'No agent found a faster route.';
  showToast(msg);

  viewStep = appState.step;
  render();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  resetState(appState, cityData);
  liveAdjacency = buildAdjacency(cityData);
  commitSnapshot(appState, []);
  viewStep = 0;

  if (selectedPickupMarker) { map.removeLayer(selectedPickupMarker); selectedPickupMarker = null; }
  if (selectedDropMarker) { map.removeLayer(selectedDropMarker); selectedDropMarker = null; }
  pickupSelect.value = '';
  dropSelect.value = '';
  render();
});

// first paint
render();
