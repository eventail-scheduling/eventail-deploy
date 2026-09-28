import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { chartImageTag, setChartImageTag, setComposeImageTag } from "../scripts/image-tags.ts";
import { type Component, components } from "../scripts/versions.ts";

// The real files, not fixtures: the edit has to leave whatever shape they
// grow into untouched, which a serializer rewriting the document would not.
const values = readFileSync("charts/eventail/values.yaml", "utf8");
const compose = readFileSync("compose/compose.yml", "utf8");

const changedLines = (before: string, after: string): string[] => {
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    assert.equal(afterLines.length, beforeLines.length);

    return afterLines.filter((line, index) => line !== beforeLines[index]);
};

describe("setChartImageTag", () => {
    for (const component of components) {
        it(`changes only the ${component} tag line`, () => {
            const updated = setChartImageTag(values, component, "9.8.7");

            assert.deepEqual(changedLines(values, updated), ['    tag: "9.8.7"']);
            assert.equal(chartImageTag(updated, component), "9.8.7");

            const other: Component = component === "api" ? "web" : "api";
            assert.equal(chartImageTag(updated, other), chartImageTag(values, other));
        });
    }
});

describe("setComposeImageTag", () => {
    for (const component of components) {
        it(`changes only the ${component} image line`, () => {
            const updated = setComposeImageTag(compose, component, "9.8.7");

            assert.deepEqual(changedLines(compose, updated), [
                `    image: ghcr.io/eventail-scheduling/eventail-${component}:9.8.7`,
            ]);
        });
    }

    it("refuses an image it does not recognize", () => {
        const renamed = compose.replace("eventail-scheduling/eventail-api:", "example/api:");

        assert.throws(() => setComposeImageTag(renamed, "api", "9.8.7"));
    });
});
