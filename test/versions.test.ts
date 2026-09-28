import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    bumpTitle,
    classifyRelease,
    isNewerRelease,
    type ReleaseKind,
    releaseMergesItself,
} from "../scripts/versions.ts";

type MatrixRow = {
    from: string;
    to: string;
    kind: ReleaseKind;
    title: string;
};

// Every row of the release matrix: below 1.0 the minor carries breaking
// changes, from 1.0 on the major does, and reaching 1.0 counts as breaking.
const matrix: MatrixRow[] = [
    { from: "0.1.1", to: "0.1.2", kind: "patch", title: "fix: update the api image to 0.1.2" },
    { from: "0.1.2", to: "0.2.0", kind: "breaking", title: "feat!: update the api image to 0.2.0" },
    { from: "0.9.1", to: "1.0.0", kind: "breaking", title: "feat!: update the api image to 1.0.0" },
    { from: "1.2.3", to: "1.2.4", kind: "patch", title: "fix: update the api image to 1.2.4" },
    { from: "1.2.4", to: "1.3.0", kind: "feature", title: "feat: update the api image to 1.3.0" },
    { from: "1.3.0", to: "2.0.0", kind: "breaking", title: "feat!: update the api image to 2.0.0" },
];

describe("classifyRelease", () => {
    for (const row of matrix) {
        it(`classifies ${row.from} to ${row.to} as ${row.kind}`, () => {
            assert.equal(classifyRelease(row.from, row.to), row.kind);
        });
    }

    it("classifies a release skipping versions by the largest step", () => {
        assert.equal(classifyRelease("0.1.1", "0.1.5"), "patch");
        assert.equal(classifyRelease("1.2.3", "1.5.0"), "feature");
        assert.equal(classifyRelease("1.2.3", "3.0.0"), "breaking");
    });

    it("rejects a version that is not newer", () => {
        assert.throws(() => classifyRelease("0.1.2", "0.1.2"));
        assert.throws(() => classifyRelease("0.1.2", "0.1.1"));
    });

    it("rejects prereleases and malformed versions", () => {
        assert.throws(() => classifyRelease("0.9.1", "1.0.0-rc.1"));
        assert.throws(() => classifyRelease("0.1.1", "v0.1.2"));
        assert.throws(() => classifyRelease("0.1.1", "latest"));
    });
});

describe("bumpTitle", () => {
    for (const row of matrix) {
        it(`titles a ${row.kind} bump to ${row.to}`, () => {
            assert.equal(bumpTitle("api", row.to, row.kind), row.title);
        });
    }
});

describe("isNewerRelease", () => {
    it("is true only for a newer plain release", () => {
        assert.equal(isNewerRelease("0.1.1", "0.1.2"), true);
        assert.equal(isNewerRelease("0.1.1", "0.1.1"), false);
        assert.equal(isNewerRelease("0.1.10", "0.1.9"), false);
        assert.throws(() => isNewerRelease("0.1.1", "0.2.0-rc.1"));
    });
});

describe("releaseMergesItself", () => {
    it("lets non-breaking chart releases merge themselves", () => {
        assert.equal(releaseMergesItself("0.1.1", "chore: release 0.1.2"), true);
        assert.equal(releaseMergesItself("1.4.0", "chore: release 1.5.0"), true);
    });

    it("leaves breaking chart releases to a person", () => {
        assert.equal(releaseMergesItself("0.0.0", "chore: release 0.1.0"), false);
        assert.equal(releaseMergesItself("0.1.2", "chore: release 0.2.0"), false);
        assert.equal(releaseMergesItself("1.4.0", "chore: release 2.0.0"), false);
    });

    it("leaves an unexpected title to a person", () => {
        assert.equal(releaseMergesItself("0.1.1", "chore(main): release 0.1.2"), false);
        assert.equal(releaseMergesItself("0.1.1", "chore: release eventail 0.1.2"), false);
    });
});
