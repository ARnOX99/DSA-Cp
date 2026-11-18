#include <stdio.h>
#include "graph.h"
#include "pathfinder.h"
#include "locations.h"
#include "precompute.h"
#include "export.h"

int main() {
    int pickupNodeIds[NUM_PICKUPS];
    int dropNodeIds[NUM_DROPS];
    int agentStartNodeIds[NUM_AGENTS];

    Graph *city = buildDemoCity(pickupNodeIds, dropNodeIds, agentStartNodeIds);
    printf("City built: %d nodes\n\n", city->numNodes);

    PathResult pickupToDrop[NUM_PICKUPS][NUM_DROPS];
    computeAllRoutes(city, pickupNodeIds, dropNodeIds, pickupToDrop);

    exportCityData(city, pickupNodeIds, dropNodeIds, agentStartNodeIds, pickupToDrop, "data.js");

    printf("\nDone. Open map.html in your browser to use the app.\n");
    return 0;
}