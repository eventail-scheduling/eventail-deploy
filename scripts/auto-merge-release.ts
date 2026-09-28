import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { disableAutoMerge, enableAutoMerge } from "./github.ts";
import { releaseMergesItself } from "./versions.ts";

const pullRequest = process.env.PR_NUMBER;
const title = process.env.PR_TITLE;

if (pullRequest === undefined || title === undefined) {
    throw new Error("PR_NUMBER and PR_TITLE must be set");
}

const current: string = parse(readFileSync("charts/eventail/Chart.yaml", "utf8")).version;

if (releaseMergesItself(current, title)) {
    enableAutoMerge(pullRequest);
} else {
    // release-please rewrites the same pull request as changes land, so
    // auto-merge from an earlier, non-breaking version may still be on.
    console.log(`"${title}" is a breaking release from ${current}, leaving the merge to a person`);
    disableAutoMerge(pullRequest);
}
