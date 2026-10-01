import semver from "semver";
import type { ReleaseUnit } from "./versions.ts";

export type OpenPullRequest = {
    number: number;
    headRefName: string;
};

export type Supersession = {
    standDown: boolean;
    close: number[];
};

export const bumpBranch = (unit: ReleaseUnit, version: string): string => `bump/${unit}-${version}`;

/**
 * Decides what a bump to `version` does about other open bumps of the image.
 *
 * Bumps of one unit change the same lines, so only the newest can merge: an
 * open bump to a newer version makes this one stand down, and older ones are
 * closed. Branches whose version does not parse are left alone.
 */
export const supersede = (
    open: OpenPullRequest[],
    unit: ReleaseUnit,
    version: string,
): Supersession => {
    const prefix = `bump/${unit}-`;
    const others = open.flatMap((pullRequest) => {
        if (!pullRequest.headRefName.startsWith(prefix)) {
            return [];
        }

        const otherVersion = semver.valid(pullRequest.headRefName.slice(prefix.length));

        if (otherVersion === null || otherVersion === version) {
            return [];
        }

        return [{ number: pullRequest.number, version: otherVersion }];
    });

    if (others.some((other) => semver.gt(other.version, version))) {
        return { standDown: true, close: [] };
    }

    return { standDown: false, close: others.map((other) => other.number) };
};
