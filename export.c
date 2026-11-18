#include <stdio.h>
#include <stdlib.h>
#include "export.h"

#define BASE_LAT 18.5204
#define BASE_LNG 73.8567
#define COORD_SCALE 0.01

void writeRoute(FILE *fp, PathResult *route) {
    fprintf(fp, "{ cost: %.2f, path: [", route->totalCost);
    for (int i = 0; i < route->pathLength; i++) {
        fprintf(fp, "%d%s", route->path[i], (i < route->pathLength - 1) ? ", " : "");
    }
    fprintf(fp, "] }");
}

void exportCityData(
    Graph *g,
    int pickupNodeIds[NUM_PICKUPS],
    int dropNodeIds[NUM_DROPS],
    int agentStartNodeIds[NUM_AGENTS],
    PathResult pickupToDrop[NUM_PICKUPS][NUM_DROPS],
    const char *filename
) {
    FILE *fp = fopen(filename, "w");
    if (fp == NULL) {
        printf("Error: could not open %s for writing\n", filename);
        return;
    }

    fprintf(fp, "const cityData = {\n");

    fprintf(fp, "  nodes: [\n");
    for (int i = 0; i < g->numNodes; i++) {
        float lat = BASE_LAT + g->nodes[i].y * COORD_SCALE;
        float lng = BASE_LNG + g->nodes[i].x * COORD_SCALE;
        fprintf(fp, "    { id: %d, lat: %.6f, lng: %.6f }%s\n",
                i, lat, lng, (i < g->numNodes - 1) ? "," : "");
    }
    fprintf(fp, "  ],\n");

    fprintf(fp, "  edges: [\n");
    int firstEdge = 1;
    for (int i = 0; i < g->numNodes; i++) {
        EdgeNode *e = g->adjList[i];
        while (e != NULL) {
            if (e->dest > i) {
                if (!firstEdge) fprintf(fp, ",\n");
                fprintf(fp, "    { from: %d, to: %d, weight: %.2f }", i, e->dest, e->weight);
                firstEdge = 0;
            }
            e = e->next;
        }
    }
    fprintf(fp, "\n  ],\n");

    fprintf(fp, "  pickups: [\n");
    for (int i = 0; i < NUM_PICKUPS; i++) {
        fprintf(fp, "    { name: \"%s\", nodeId: %d }%s\n",
                pickupNames[i], pickupNodeIds[i], (i < NUM_PICKUPS - 1) ? "," : "");
    }
    fprintf(fp, "  ],\n");

    fprintf(fp, "  drops: [\n");
    for (int i = 0; i < NUM_DROPS; i++) {
        fprintf(fp, "    { name: \"%s\", nodeId: %d }%s\n",
                dropNames[i], dropNodeIds[i], (i < NUM_DROPS - 1) ? "," : "");
    }
    fprintf(fp, "  ],\n");

    fprintf(fp, "  agents: [\n");
    for (int i = 0; i < NUM_AGENTS; i++) {
        fprintf(fp, "    { id: %d, startNodeId: %d }%s\n",
                i, agentStartNodeIds[i], (i < NUM_AGENTS - 1) ? "," : "");
    }
    fprintf(fp, "  ],\n");

    fprintf(fp, "  pickupToDropRoutes: [\n");
    for (int p = 0; p < NUM_PICKUPS; p++) {
        fprintf(fp, "    [\n      ");
        for (int d = 0; d < NUM_DROPS; d++) {
            writeRoute(fp, &pickupToDrop[p][d]);
            fprintf(fp, "%s", (d < NUM_DROPS - 1) ? ",\n      " : "\n");
        }
        fprintf(fp, "    ]%s\n", (p < NUM_PICKUPS - 1) ? "," : "");
    }
    fprintf(fp, "  ]\n");

    fprintf(fp, "};\n");
    fclose(fp);
    printf("Exported city data to %s\n", filename);
}