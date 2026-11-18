#ifndef GRAPH_H
#define GRAPH_H

#define MAX_NODES 100

typedef struct Node {
    int id;
    float x, y;
} Node;

typedef struct EdgeNode {
    int dest;
    float weight;
    struct EdgeNode *next;
} EdgeNode;

typedef struct Graph {
    int numNodes;
    Node nodes[MAX_NODES];
    EdgeNode *adjList[MAX_NODES];
} Graph;

Graph* createGraph();
int addNode(Graph *g, float x, float y);
float calculateDistance(Graph *g, int id1, int id2);
void addEdge(Graph *g, int src, int dest, float weight, int bidirectional);
void printGraph(Graph *g);

#endif