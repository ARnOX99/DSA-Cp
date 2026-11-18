#include <stdio.h>
#include "precompute.h"

void computeAllRoutes(
    Graph *g,
    int pickupNodeIds[NUM_PICKUPS],
    int dropNodeIds[NUM_DROPS],
    PathResult pickupToDrop[NUM_PICKUPS][NUM_DROPS]
) {
    printf("Precomputing pickup -> drop routes...\n");
    for (int p = 0; p < NUM_PICKUPS; p++) {
        for (int d = 0; d < NUM_DROPS; d++) {
            pickupToDrop[p][d] = dijkstra(g, pickupNodeIds[p], dropNodeIds[d]);
            printf("  %s -> %s: cost=%.2f\n", pickupNames[p], dropNames[d], pickupToDrop[p][d].totalCost);
        }
    }
}