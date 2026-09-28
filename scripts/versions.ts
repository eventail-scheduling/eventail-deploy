import semver from "semver";

export type ReleaseKind = "patch" | "feature" | "breaking";

export type Component = "api" | "web";

export const components: readonly Component[] = ["api", "web"];

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

export const bumpTitle = (component: Component, version: string, kind: ReleaseKind): string =>
    `${bumpCommitTypes[kind]}: update the ${component} image to ${version}`;

/** Leaves the merge to a person for a breaking release and for any unexpected title. */
export const releaseMergesItself = (currentVersion: string, pullRequestTitle: string): boolean => {
    const proposed = /^chore: release (\S+)$/.exec(pullRequestTitle)?.[1];

    if (proposed === undefined) {
        return false;
    }

    return classifyRelease(currentVersion, proposed) !== "breaking";
};
