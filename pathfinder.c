#include <stdio.h>
#include <stdlib.h>
#include <float.h>
#include "pathfinder.h"
#include "minheap.h"

int isValidNode(Graph *g, int id) { return (id >= 0 && id < g->numNodes); }

PathResult emptyResult() {
    PathResult r; r.found = 0; r.pathLength = 0; r.totalCost = FLT_MAX; r.nodesExplored = 0;
    return r;
}

PathResult trivialResult(int node) {
    PathResult r; r.found = 1; r.pathLength = 1; r.path[0] = node; r.totalCost = 0; r.nodesExplored = 1;
    return r;
}

PathResult dijkstra(Graph *g, int start, int end) {
    if (!isValidNode(g, start) || !isValidNode(g, end)) return emptyResult();
    if (start == end) return trivialResult(start);

    float distance[MAX_NODES]; int parent[MAX_NODES]; int visited[MAX_NODES]; int exploredCount = 0;
    for (int i = 0; i < g->numNodes; i++) { distance[i] = FLT_MAX; parent[i] = -1; visited[i] = 0; }
    distance[start] = 0;

    MinHeap *heap = createMinHeap();
    insertMinHeap(heap, start, 0);

    while (!isEmptyHeap(heap)) {
        HeapNode current = extractMin(heap);
        int u = current.nodeId;
        if (visited[u]) continue;
        visited[u] = 1; exploredCount++;
        if (u == end) break;

        EdgeNode *edge = g->adjList[u];
        while (edge != NULL) {
            int v = edge->dest;
            float newDist = distance[u] + edge->weight;
            if (newDist < distance[v]) {
                distance[v] = newDist; parent[v] = u;
                insertMinHeap(heap, v, newDist);
            }
            edge = edge->next;
        }
    }

    PathResult result; result.totalCost = distance[end]; result.nodesExplored = exploredCount;
    if (distance[end] == FLT_MAX) { free(heap); return emptyResult(); }

    result.found = 1;
    int tempPath[MAX_NODES]; int count = 0; int node = end;
    while (node != -1) { tempPath[count] = node; count++; node = parent[node]; }
    result.pathLength = count;
    for (int i = 0; i < count; i++) result.path[i] = tempPath[count - 1 - i];
    free(heap);
    return result;
}

PathResult astar(Graph *g, int start, int end) {
    if (!isValidNode(g, start) || !isValidNode(g, end)) return emptyResult();
    if (start == end) return trivialResult(start);

    float distance[MAX_NODES]; int parent[MAX_NODES]; int visited[MAX_NODES]; int exploredCount = 0;
    for (int i = 0; i < g->numNodes; i++) { distance[i] = FLT_MAX; parent[i] = -1; visited[i] = 0; }
    distance[start] = 0;

    MinHeap *heap = createMinHeap();
    insertMinHeap(heap, start, calculateDistance(g, start, end));

    while (!isEmptyHeap(heap)) {
        HeapNode current = extractMin(heap);
        int u = current.nodeId;
        if (visited[u]) continue;
        visited[u] = 1; exploredCount++;
        if (u == end) break;

        EdgeNode *edge = g->adjList[u];
        while (edge != NULL) {
            int v = edge->dest;
            float newDist = distance[u] + edge->weight;
            if (newDist < distance[v]) {
                distance[v] = newDist; parent[v] = u;
                float priority = newDist + calculateDistance(g, v, end);
                insertMinHeap(heap, v, priority);
            }
            edge = edge->next;
        }
    }

    PathResult result; result.totalCost = distance[end]; result.nodesExplored = exploredCount;
    if (distance[end] == FLT_MAX) { free(heap); return emptyResult(); }

    result.found = 1;
    int tempPath[MAX_NODES]; int count = 0; int node = end;
    while (node != -1) { tempPath[count] = node; count++; node = parent[node]; }
    result.pathLength = count;
    for (int i = 0; i < count; i++) result.path[i] = tempPath[count - 1 - i];
    free(heap);
    return result;
}