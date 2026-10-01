import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    bumpTitle,
    classifyRelease,
    isNewerRelease,
    parseReleaseTitle,
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
    { from: "0.1.1", to: "0.1.2", kind: "patch", title: "fix: update eventail to 0.1.2" },
    { from: "0.1.2", to: "0.2.0", kind: "breaking", title: "feat!: update eventail to 0.2.0" },
    { from: "0.9.1", to: "1.0.0", kind: "breaking", title: "feat!: update eventail to 1.0.0" },
    { from: "1.2.3", to: "1.2.4", kind: "patch", title: "fix: update eventail to 1.2.4" },
    { from: "1.2.4", to: "1.3.0", kind: "feature", title: "feat: update eventail to 1.3.0" },
    { from: "1.3.0", to: "2.0.0", kind: "breaking", title: "feat!: update eventail to 2.0.0" },
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
            assert.equal(bumpTitle("eventail", row.to, row.kind), row.title);
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
        assert.equal(releaseMergesItself("0.1.1", "chore(eventail): release 0.1.2"), true);
        assert.equal(
            releaseMergesItself("1.4.0", "chore(furry-schedule-adapter): release 1.5.0"),
            true,
        );
    });

    it("leaves breaking chart releases to a person", () => {
        assert.equal(releaseMergesItself("0.0.0", "chore(eventail): release 0.1.0"), false);
        assert.equal(releaseMergesItself("0.1.2", "chore(eventail): release 0.2.0"), false);
        assert.equal(releaseMergesItself("1.4.0", "chore(eventail): release 2.0.0"), false);
    });

    it("leaves a title it does not recognize to a person", () => {
        assert.equal(releaseMergesItself("0.1.1", "chore: release 0.1.2"), false);
        assert.equal(releaseMergesItself("0.1.1", "chore(nonesuch): release 0.1.2"), false);
    });
});

describe("parseReleaseTitle", () => {
    it("reads the unit and the version out of a release title", () => {
        assert.deepEqual(parseReleaseTitle("chore(eventail): release 0.1.2"), {
            unit: "eventail",
            version: "0.1.2",
        });
        assert.deepEqual(parseReleaseTitle("chore(furry-schedule-adapter): release 1.5.0"), {
            unit: "furry-schedule-adapter",
            version: "1.5.0",
        });
    });

    it("answers null for a prerelease, which classifyRelease would throw on", () => {
        // release-please writes one from a `Release-As: 1.0.0-rc.1` footer
        // with no config change, so this is reachable without hand-editing.
        assert.equal(parseReleaseTitle("chore(eventail): release 0.2.0-rc.1"), null);
        assert.equal(releaseMergesItself("0.1.1", "chore(eventail): release 0.2.0-rc.1"), false);
    });

    it("answers null for a v-prefixed version, which semver.valid tolerates", () => {
        // `semver.valid("v0.1.2")` is "0.1.2", so a lenient check would carry
        // the raw `v0.1.2` forward into a comparison.
        assert.equal(parseReleaseTitle("chore(eventail): release v0.1.2"), null);
    });

    it("answers null where a version is not a version", () => {
        // Grouped releases title themselves after the branch. classifyRelease
        // throws on anything that is not a release, so this has to be caught
        // before it reaches there rather than after.
        assert.equal(parseReleaseTitle("chore: release main"), null);
        assert.equal(parseReleaseTitle("chore(eventail): release main"), null);
        assert.equal(releaseMergesItself("0.1.1", "chore: release main"), false);
    });
});
