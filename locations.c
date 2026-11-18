#include <stdio.h>
#include "locations.h"

const char* pickupNames[NUM_PICKUPS] = {
    "Restaurant A", "Restaurant B", "Restaurant C", "Restaurant D", "Restaurant E"
};
const char* dropNames[NUM_DROPS] = {
    "Drop A", "Drop B", "Drop C", "Drop D", "Drop E"
};

Graph* buildDemoCity(int pickupNodeIds[NUM_PICKUPS], int dropNodeIds[NUM_DROPS], int agentStartNodeIds[NUM_AGENTS]) {
    Graph *g = createGraph();

    // 5 columns x 4 rows grid = 20 nodes, spaced out for a believable city layout
    int grid[4][5];
    for (int row = 0; row < 4; row++) {
        for (int col = 0; col < 5; col++) {
            grid[row][col] = addNode(g, col * 3.0, row * 3.0);
        }
    }

    // connect horizontal roads
    for (int row = 0; row < 4; row++) {
        for (int col = 0; col < 4; col++) {
            addEdge(g, grid[row][col], grid[row][col + 1], -1, 1);
        }
    }
    // connect vertical roads
    for (int row = 0; row < 3; row++) {
        for (int col = 0; col < 5; col++) {
            addEdge(g, grid[row][col], grid[row + 1][col], -1, 1);
        }
    }
    // a few diagonal shortcuts, so routes have real alternatives (matters for
    // both realistic pathfinding AND for the traffic-reroute demo later)
    addEdge(g, grid[0][0], grid[1][1], -1, 1);
    addEdge(g, grid[1][2], grid[2][3], -1, 1);
    addEdge(g, grid[2][1], grid[3][2], -1, 1);
    addEdge(g, grid[0][3], grid[1][4], -1, 1);

    // pickups: spread across the grid, not clustered
    pickupNodeIds[0] = grid[0][0];   // Restaurant A - top-left
    pickupNodeIds[1] = grid[0][4];   // Restaurant B - top-right
    pickupNodeIds[2] = grid[2][2];   // Restaurant C - center
    pickupNodeIds[3] = grid[3][0];   // Restaurant D - bottom-left
    pickupNodeIds[4] = grid[1][3];   // Restaurant E - upper-right area

    // drops: also spread out, overlapping some areas so routes have real length variety
    dropNodeIds[0] = grid[3][4];     // Drop A - bottom-right
    dropNodeIds[1] = grid[3][2];     // Drop B - bottom-center
    dropNodeIds[2] = grid[0][2];     // Drop C - top-center
    dropNodeIds[3] = grid[2][0];     // Drop D - mid-left
    dropNodeIds[4] = grid[1][1];     // Drop E - upper-left area

    // agents: 3 scattered starting positions, not near each other
    agentStartNodeIds[0] = grid[0][1];   // near top
    agentStartNodeIds[1] = grid[3][3];   // near bottom-right
    agentStartNodeIds[2] = grid[2][4];   // right side

    return g;
}