#ifndef PATHFINDER_H
#define PATHFINDER_H

#include "graph.h"

typedef struct {
    int path[MAX_NODES];
    int pathLength;
    float totalCost;
    int found;
    int nodesExplored;   // how many nodes were finalized/visited — for comparing algorithms
} PathResult;

PathResult dijkstra(Graph *g, int start, int end);
PathResult astar(Graph *g, int start, int end);

#endif