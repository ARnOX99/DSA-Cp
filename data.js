const cityData = {
  nodes: [
    { id: 0, lat: 18.520399, lng: 73.856697 },
    { id: 1, lat: 18.520399, lng: 73.886703 },
    { id: 2, lat: 18.520399, lng: 73.916702 },
    { id: 3, lat: 18.520399, lng: 73.946701 },
    { id: 4, lat: 18.520399, lng: 73.976700 },
    { id: 5, lat: 18.550400, lng: 73.856697 },
    { id: 6, lat: 18.550400, lng: 73.886703 },
    { id: 7, lat: 18.550400, lng: 73.916702 },
    { id: 8, lat: 18.550400, lng: 73.946701 },
    { id: 9, lat: 18.550400, lng: 73.976700 },
    { id: 10, lat: 18.580400, lng: 73.856697 },
    { id: 11, lat: 18.580400, lng: 73.886703 },
    { id: 12, lat: 18.580400, lng: 73.916702 },
    { id: 13, lat: 18.580400, lng: 73.946701 },
    { id: 14, lat: 18.580400, lng: 73.976700 },
    { id: 15, lat: 18.610399, lng: 73.856697 },
    { id: 16, lat: 18.610399, lng: 73.886703 },
    { id: 17, lat: 18.610399, lng: 73.916702 },
    { id: 18, lat: 18.610399, lng: 73.946701 },
    { id: 19, lat: 18.610399, lng: 73.976700 }
  ],
  edges: [
    { from: 0, to: 6, weight: 4.24 },
    { from: 0, to: 5, weight: 3.00 },
    { from: 0, to: 1, weight: 3.00 },
    { from: 1, to: 6, weight: 3.00 },
    { from: 1, to: 2, weight: 3.00 },
    { from: 2, to: 7, weight: 3.00 },
    { from: 2, to: 3, weight: 3.00 },
    { from: 3, to: 9, weight: 4.24 },
    { from: 3, to: 8, weight: 3.00 },
    { from: 3, to: 4, weight: 3.00 },
    { from: 4, to: 9, weight: 3.00 },
    { from: 5, to: 10, weight: 3.00 },
    { from: 5, to: 6, weight: 3.00 },
    { from: 6, to: 11, weight: 3.00 },
    { from: 6, to: 7, weight: 3.00 },
    { from: 7, to: 13, weight: 4.24 },
    { from: 7, to: 12, weight: 3.00 },
    { from: 7, to: 8, weight: 3.00 },
    { from: 8, to: 13, weight: 3.00 },
    { from: 8, to: 9, weight: 3.00 },
    { from: 9, to: 14, weight: 3.00 },
    { from: 10, to: 15, weight: 3.00 },
    { from: 10, to: 11, weight: 3.00 },
    { from: 11, to: 17, weight: 4.24 },
    { from: 11, to: 16, weight: 3.00 },
    { from: 11, to: 12, weight: 3.00 },
    { from: 12, to: 17, weight: 3.00 },
    { from: 12, to: 13, weight: 3.00 },
    { from: 13, to: 18, weight: 3.00 },
    { from: 13, to: 14, weight: 3.00 },
    { from: 14, to: 19, weight: 3.00 },
    { from: 15, to: 16, weight: 3.00 },
    { from: 16, to: 17, weight: 3.00 },
    { from: 17, to: 18, weight: 3.00 },
    { from: 18, to: 19, weight: 3.00 }
  ],
  pickups: [
    { name: "Restaurant A", nodeId: 0 },
    { name: "Restaurant B", nodeId: 4 },
    { name: "Restaurant C", nodeId: 12 },
    { name: "Restaurant D", nodeId: 15 },
    { name: "Restaurant E", nodeId: 8 }
  ],
  drops: [
    { name: "Drop A", nodeId: 19 },
    { name: "Drop B", nodeId: 17 },
    { name: "Drop C", nodeId: 2 },
    { name: "Drop D", nodeId: 10 },
    { name: "Drop E", nodeId: 6 }
  ],
  agents: [
    { id: 0, startNodeId: 1 },
    { id: 1, startNodeId: 18 },
    { id: 2, startNodeId: 14 }
  ],
  agentToPickupRoutes: [
    [
      { cost: 3.00, path: [1, 0] },
      { cost: 9.00, path: [1, 2, 3, 4] },
      { cost: 9.00, path: [1, 6, 7, 12] },
      { cost: 12.00, path: [1, 6, 5, 10, 15] },
      { cost: 9.00, path: [1, 6, 7, 8] }
    ],
    [
      { cost: 14.49, path: [18, 13, 7, 6, 0] },
      { cost: 12.00, path: [18, 13, 8, 3, 4] },
      { cost: 6.00, path: [18, 13, 12] },
      { cost: 9.00, path: [18, 17, 16, 15] },
      { cost: 6.00, path: [18, 13, 8] }
    ],
    [
      { cost: 14.49, path: [14, 13, 7, 6, 0] },
      { cost: 6.00, path: [14, 9, 4] },
      { cost: 6.00, path: [14, 13, 12] },
      { cost: 15.00, path: [14, 13, 12, 11, 10, 15] },
      { cost: 6.00, path: [14, 13, 8] }
    ]
  ],
  pickupToDropRoutes: [
    [
      { cost: 17.49, path: [0, 6, 7, 13, 18, 19] },
      { cost: 11.49, path: [0, 6, 11, 17] },
      { cost: 6.00, path: [0, 1, 2] },
      { cost: 6.00, path: [0, 5, 10] },
      { cost: 4.24, path: [0, 6] }
    ],
    [
      { cost: 9.00, path: [4, 9, 14, 19] },
      { cost: 15.00, path: [4, 9, 8, 7, 12, 17] },
      { cost: 6.00, path: [4, 3, 2] },
      { cost: 18.00, path: [4, 3, 2, 1, 6, 5, 10] },
      { cost: 12.00, path: [4, 3, 2, 1, 6] }
    ],
    [
      { cost: 9.00, path: [12, 13, 14, 19] },
      { cost: 3.00, path: [12, 17] },
      { cost: 6.00, path: [12, 7, 2] },
      { cost: 6.00, path: [12, 11, 10] },
      { cost: 6.00, path: [12, 11, 6] }
    ],
    [
      { cost: 12.00, path: [15, 16, 17, 18, 19] },
      { cost: 6.00, path: [15, 16, 17] },
      { cost: 15.00, path: [15, 10, 11, 12, 7, 2] },
      { cost: 3.00, path: [15, 10] },
      { cost: 9.00, path: [15, 10, 11, 6] }
    ],
    [
      { cost: 9.00, path: [8, 13, 14, 19] },
      { cost: 9.00, path: [8, 13, 12, 17] },
      { cost: 6.00, path: [8, 7, 2] },
      { cost: 12.00, path: [8, 7, 6, 5, 10] },
      { cost: 6.00, path: [8, 7, 6] }
    ]
  ]
};
