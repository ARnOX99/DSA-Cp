#ifndef PRECOMPUTE_H
#define PRECOMPUTE_H
#include "graph.h"
#include "pathfinder.h"
#include "locations.h"

// computes every pickup -> drop route ahead of time. Agent -> pickup routes
// are not precomputed: agents keep their position between orders, so the
// frontend computes those live from the agent's current node
void computeAllRoutes(
    Graph *g,
    int pickupNodeIds[NUM_PICKUPS],
    int dropNodeIds[NUM_DROPS],
    PathResult pickupToDrop[NUM_PICKUPS][NUM_DROPS]
);

#endif