import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bumpBranch, supersede } from "../scripts/bumps.ts";

describe("bumpBranch", () => {
    it("names the branch after the image and version", () => {
        assert.equal(bumpBranch("web", "0.1.2"), "bump/web-0.1.2");
    });
});

describe("supersede", () => {
    it("closes older bumps of the same image", () => {
        const result = supersede(
            [
                { number: 7, headRefName: "bump/api-0.1.2" },
                { number: 8, headRefName: "bump/api-0.1.1" },
            ],
            "api",
            "0.1.3",
        );

        assert.deepEqual(result, { standDown: false, close: [7, 8] });
    });

    it("stands down when a newer bump of the same image is open", () => {
        const result = supersede(
            [
                { number: 7, headRefName: "bump/api-0.1.2" },
                { number: 9, headRefName: "bump/api-0.1.4" },
            ],
            "api",
            "0.1.3",
        );

        assert.deepEqual(result, { standDown: true, close: [] });
    });

    it("compares versions numerically", () => {
        const result = supersede([{ number: 9, headRefName: "bump/api-0.1.10" }], "api", "0.1.9");

        assert.deepEqual(result, { standDown: true, close: [] });
    });

    it("does nothing when no other bump is open", () => {
        assert.deepEqual(supersede([], "api", "0.1.3"), { standDown: false, close: [] });
    });

    it("leaves other images, its own branch and unrelated branches alone", () => {
        const result = supersede(
            [
                { number: 3, headRefName: "bump/web-0.1.2" },
                { number: 4, headRefName: "bump/api-0.1.3" },
                { number: 5, headRefName: "release-please--branches--main--components--eventail" },
                { number: 6, headRefName: "bump/api-next" },
            ],
            "api",
            "0.1.3",
        );

        assert.deepEqual(result, { standDown: false, close: [] });
    });
});
