import semver from "semver";

export type ReleaseKind = "patch" | "feature" | "breaking";

/** What releases upstream, which is not one-to-one with what gets an image. */
export type ReleaseUnit = "eventail" | "furry-schedule-adapter";

export type ImageName = "api" | "web" | "furry-schedule-adapter";

export type UnitShape = {
    images: readonly [ImageName, ...ImageName[]];
    chart: string;
    sourceRepository: string;
};

export const unitShapes: Record<ReleaseUnit, UnitShape> = {
    eventail: {
        images: ["api", "web"],
        chart: "charts/eventail",
        sourceRepository: "eventail",
    },
    "furry-schedule-adapter": {
        images: ["furry-schedule-adapter"],
        chart: "charts/eventail-furry-schedule-adapter",
        sourceRepository: "eventail-furry-schedule-adapter",
    },
};

export const releaseUnits: readonly ReleaseUnit[] = Object.keys(unitShapes) as ReleaseUnit[];

const bumpCommitTypes: Record<ReleaseKind, string> = {
    patch: "fix",
    feature: "feat",
    breaking: "feat!",
};

const assertRelease = (version: string): void => {
    if (semver.valid(version) !== version || semver.prerelease(version) !== null) {
        throw new Error(`Not a release version: ${version}`);
    }
};

/**
 * Treats a new minor as breaking below 1.0, and a new major from 1.0 on.
 *
 * Below 1.0 a feature bumps only the patch, so a 0.x patch may carry features
 * and still counts as a patch. Throws unless both are plain release versions
 * and `to` is newer than `from`.
 */
export const classifyRelease = (from: string, to: string): ReleaseKind => {
    assertRelease(from);
    assertRelease(to);

    if (!semver.gt(to, from)) {
        throw new Error(`${to} is not newer than ${from}`);
    }

    const diff = semver.diff(from, to);

    if (diff === "major") {
        return "breaking";
    }

    if (semver.major(to) === 0) {
        return diff === "minor" ? "breaking" : "patch";
    }

    return diff === "minor" ? "feature" : "patch";
};

/** Throws when `version` is not a plain release version, rather than answering false. */
export const isNewerRelease = (current: string, version: string): boolean => {
    assertRelease(version);
    return semver.gt(version, current);
};

export const bumpTitle = (unit: ReleaseUnit, version: string, kind: ReleaseKind): string =>
    `${bumpCommitTypes[kind]}: update ${unit} to ${version}`;

export type ProposedRelease = {
    unit: ReleaseUnit;
    version: string;
};

/**
 * Reads the unit and version out of a release pull request's title.
 *
 * The title pattern is pinned in release-please-config.json so this can parse
 * it. Answers null for any title that does not match, which leaves the merge
 * to a person rather than guessing.
 */
export const parseReleaseTitle = (pullRequestTitle: string): ProposedRelease | null => {
    const matched = /^chore\((\S+)\): release (\S+)$/.exec(pullRequestTitle);

    if (matched === null) {
        return null;
    }

    const [, unit, version] = matched;
    const known = releaseUnits.find((candidate) => candidate === unit);

    // semver.valid answers "0.1.2" for "v0.1.2", so comparing against the
    // input is what rejects a prefix rather than carrying it forward.
    if (
        known === undefined ||
        version === undefined ||
        semver.valid(version) !== version ||
        semver.prerelease(version) !== null
    ) {
        return null;
    }

    return { unit: known, version };
};

/** Leaves the merge to a person for a breaking release and for any unexpected title. */
export const releaseMergesItself = (currentVersion: string, pullRequestTitle: string): boolean => {
    const proposed = parseReleaseTitle(pullRequestTitle);

    if (proposed === null) {
        return false;
    }

    return classifyRelease(currentVersion, proposed.version) !== "breaking";
};
