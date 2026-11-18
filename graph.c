#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "graph.h"

// paste all your function implementations here (createGraph, addNode, calculateDistance, addEdge, printGraph)
// — exactly as you already wrote them, just without the struct definitions (those moved to the .h file)


Graph* createGraph() {
    Graph *g = malloc(sizeof(Graph));
    g->numNodes = 0;
    for (int i = 0; i < MAX_NODES; i++) {
        g->adjList[i] = NULL;
    }
    return g;
}

// Add a node (intersection) with an id and coordinates
int addNode(Graph *g, float x, float y) {
    int id = g->numNodes;
    g->nodes[id].id = id;
    g->nodes[id].x = x;
    g->nodes[id].y = y;
    g->numNodes++;
    return id;
}

//task2 : calculate dist bw two nodes
float calculateDistance(Graph *g, int id1, int id2) {
    float dx = g->nodes[id1].x - g->nodes[id2].x;
    float dy = g->nodes[id1].y - g->nodes[id2].y;
    return sqrt(dx * dx + dy * dy);
}

// Add a road between two nodes with a given weight
void addEdge(Graph *g, int src, int dest, float weight, int bidirectional) {
  if (weight < 0) {
        weight = calculateDistance(g, src, dest);   // auto-calculate if not given
  }
    // create new edge node for src -> dest
    EdgeNode *edge1 = malloc(sizeof(EdgeNode));
    edge1->dest = dest;
    edge1->weight = weight;
    edge1->next = g->adjList[src];   // insert at head of src's list
    g->adjList[src] = edge1;
 
    if (bidirectional) {
        EdgeNode *edge2 = malloc(sizeof(EdgeNode));
        edge2->dest = src;
        edge2->weight = weight;
        edge2->next = g->adjList[dest];
        g->adjList[dest] = edge2;
    }
}

// Print the graph: each node and its connected roads
void printGraph(Graph *g) {
    for (int i = 0; i < g->numNodes; i++) {
        printf("Node %d (%.1f, %.1f) -> ", i, g->nodes[i].x, g->nodes[i].y);
        EdgeNode *temp = g->adjList[i];
        while (temp != NULL) {
            printf("[%d, weight=%.1f] ", temp->dest, temp->weight);
            temp = temp->next;
        }
        printf("\n");
    }
}