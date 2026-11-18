#include <stdio.h>
#include <stdlib.h>
#include "minheap.h"

MinHeap* createMinHeap() {
    MinHeap *h = malloc(sizeof(MinHeap));
    h->size = 0;
    return h;
}

int isEmptyHeap(MinHeap *h) {
    return h->size == 0;
}

void swapNodes(HeapNode *a, HeapNode *b) {
    HeapNode temp = *a;
    *a = *b;
    *b = temp;
}

// after adding a new item at the end, move it up until heap property holds
void siftUp(MinHeap *h, int index) {
    while (index > 0) {
        int parent = (index - 1) / 2;
        if (h->nodes[index].distance < h->nodes[parent].distance) {
            swapNodes(&h->nodes[index], &h->nodes[parent]);
            index = parent;
        } else {
            break;   // heap property satisfied, stop
        }
    }
}

// after removing the root, move the replacement down until heap property holds
void siftDown(MinHeap *h, int index) {
    while (1) {
        int left = 2 * index + 1;
        int right = 2 * index + 2;
        int smallest = index;

        if (left < h->size && h->nodes[left].distance < h->nodes[smallest].distance) {
            smallest = left;
        }
        if (right < h->size && h->nodes[right].distance < h->nodes[smallest].distance) {
            smallest = right;
        }
        if (smallest == index) {
            break;   // heap property satisfied, stop
        }

        swapNodes(&h->nodes[index], &h->nodes[smallest]);
        index = smallest;
    }
}

void insertMinHeap(MinHeap *h, int nodeId, float distance) {
    h->nodes[h->size].nodeId = nodeId;
    h->nodes[h->size].distance = distance;
    siftUp(h, h->size);
    h->size++;
}

HeapNode extractMin(MinHeap *h) {
    HeapNode minNode = h->nodes[0];        // root is always the smallest
    h->size--;
    h->nodes[0] = h->nodes[h->size];       // move last element to root
    siftDown(h, 0);
    return minNode;
}