#ifndef MINHEAP_H
#define MINHEAP_H

#define MAX_HEAP_SIZE 200

typedef struct {
    int nodeId;
    float distance;   // this is the "priority" — smaller distance = higher priority
} HeapNode;

typedef struct {
    HeapNode nodes[MAX_HEAP_SIZE];
    int size;
} MinHeap;

MinHeap* createMinHeap();
void insertMinHeap(MinHeap *h, int nodeId, float distance);
HeapNode extractMin(MinHeap *h);
int isEmptyHeap(MinHeap *h);

#endif