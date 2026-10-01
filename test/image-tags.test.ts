import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { chartImageTag, setChartImageTag, setComposeImageTag } from "../scripts/image-tags.ts";
import { type ReleaseUnit, type UnitShape, unitShapes } from "../scripts/versions.ts";

// The real files, not fixtures: the edit has to leave whatever shape they
// grow into untouched, which a serializer rewriting the document would not.
const compose = readFileSync("compose/compose.yml", "utf8");

const units = Object.entries(unitShapes) as [ReleaseUnit, UnitShape][];

const changedLines = (before: string, after: string): string[] => {
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    assert.equal(afterLines.length, beforeLines.length);

    return afterLines.filter((line, index) => line !== beforeLines[index]);
};

describe("setChartImageTag", () => {
    for (const [unit, shape] of units) {
        const values = readFileSync(`${shape.chart}/values.yaml`, "utf8");

        for (const image of shape.images) {
            it(`changes only the ${image} tag line in the ${unit} chart`, () => {
                const updated = setChartImageTag(values, image, "9.8.7");

                assert.deepEqual(changedLines(values, updated), ['    tag: "9.8.7"']);
                assert.equal(chartImageTag(updated, image), "9.8.7");

                for (const other of shape.images.filter((candidate) => candidate !== image)) {
                    assert.equal(chartImageTag(updated, other), chartImageTag(values, other));
                }
            });
        }
    }
});

describe("setComposeImageTag", () => {
    for (const [, shape] of units) {
        for (const image of shape.images) {
            it(`changes only the ${image} image line`, () => {
                const updated = setComposeImageTag(compose, image, "9.8.7");

                assert.deepEqual(changedLines(compose, updated), [
                    `    image: ghcr.io/eventail-scheduling/eventail-${image}:9.8.7`,
                ]);
            });
        }
    }

    it("refuses an image it does not recognize", () => {
        const renamed = compose.replace("eventail-scheduling/eventail-api:", "example/api:");

        assert.throws(() => setComposeImageTag(renamed, "api", "9.8.7"));
    });
});
