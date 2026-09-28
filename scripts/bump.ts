import { readFileSync, writeFileSync } from "node:fs";
import { bumpBranch, supersede } from "./bumps.ts";
import {
    botEmail,
    closePullRequest,
    createPullRequest,
    enableAutoMerge,
    hasOpenPullRequest,
    openPullRequests,
    run,
} from "./github.ts";
import { chartImageTag, setChartImageTag, setComposeImageTag } from "./image-tags.ts";
import {
    bumpTitle,
    type Component,
    classifyRelease,
    components,
    isNewerRelease,
} from "./versions.ts";

const valuesPath = "charts/eventail/values.yaml";
const composePath = "compose/compose.yml";

const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (value === undefined || value === "") {
        throw new Error(`${name} is not set`);
    }

    return value;
};

const component = requireEnv("COMPONENT") as Component;

if (!components.includes(component)) {
    throw new Error(`Unknown component: ${component}`);
}

const version = requireEnv("VERSION");
const values = readFileSync(valuesPath, "utf8");
const current = chartImageTag(values, component);

if (!isNewerRelease(current, version)) {
    console.log(`The ${component} image is already at ${current}, nothing to do`);
    process.exit(0);
}

const kind = classifyRelease(current, version);
const branch = bumpBranch(component, version);

if (supersede(openPullRequests(), component, version).standDown) {
    console.log(`A bump of the ${component} image past ${version} is already open, nothing to do`);
    process.exit(0);
}

writeFileSync(valuesPath, setChartImageTag(values, component, version));
writeFileSync(
    composePath,
    setComposeImageTag(readFileSync(composePath, "utf8"), component, version),
);

const title = bumpTitle(component, version, kind);
const appSlug = requireEnv("APP_SLUG");

run("git", ["config", "user.name", `${appSlug}[bot]`]);
run("git", ["config", "user.email", botEmail(appSlug)]);
run("git", ["switch", "-c", branch]);
run("git", ["commit", "-m", title, "--", valuesPath, composePath]);
run("git", ["push", "--force", "origin", branch]);

const release = `https://github.com/eventail-scheduling/eventail-${component}/releases/tag/v${version}`;

if (!hasOpenPullRequest(branch)) {
    createPullRequest(
        branch,
        title,
        kind === "breaking"
            ? `Released as ${release}. A breaking release, so this waits for a manual merge.`
            : `Released as ${release}.`,
    );
}

// Checked again now that this pull request exists: a run for another release
// of the image may have opened its own in the meantime, and of two such runs
// at least the later one sees both.
const supersession = supersede(openPullRequests(), component, version);

if (supersession.standDown) {
    closePullRequest(branch, "Superseded by a newer release.");
    process.exit(0);
}

for (const number of supersession.close) {
    closePullRequest(String(number), `Superseded by ${version}.`);
}

if (kind !== "breaking") {
    enableAutoMerge(branch);
}
