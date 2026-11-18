#ifndef EXPORT_H
#define EXPORT_H
#include "graph.h"
#include "pathfinder.h"
#include "locations.h"

void exportCityData(
    Graph *g,
    int pickupNodeIds[NUM_PICKUPS],
    int dropNodeIds[NUM_DROPS],
    int agentStartNodeIds[NUM_AGENTS],
    PathResult pickupToDrop[NUM_PICKUPS][NUM_DROPS],
    const char *filename
);

#endif