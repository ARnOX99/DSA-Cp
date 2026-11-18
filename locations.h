#ifndef LOCATIONS_H
#define LOCATIONS_H
#include "graph.h"

#define NUM_PICKUPS 5
#define NUM_DROPS 5
#define NUM_AGENTS 3

extern const char* pickupNames[NUM_PICKUPS];
extern const char* dropNames[NUM_DROPS];

// builds the demo city and fills in which node id corresponds to each
// named pickup, drop, and agent starting position
Graph* buildDemoCity(int pickupNodeIds[NUM_PICKUPS], int dropNodeIds[NUM_DROPS], int agentStartNodeIds[NUM_AGENTS]);

#endif