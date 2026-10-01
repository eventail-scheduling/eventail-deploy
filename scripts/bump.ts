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
import {
    chartImageTag,
    setChartAppVersion,
    setChartImageTag,
    setComposeImageTag,
} from "./image-tags.ts";
import {
    bumpTitle,
    classifyRelease,
    isNewerRelease,
    releaseUnits,
    unitShapes,
} from "./versions.ts";

const composePath = "compose/compose.yml";

const requireEnv = (name: string): string => {
    const value = process.env[name];

    if (value === undefined || value === "") {
        throw new Error(`${name} is not set`);
    }

    return value;
};

const requested = requireEnv("COMPONENT");
const unit = releaseUnits.find((candidate) => candidate === requested);

if (unit === undefined) {
    throw new Error(`Unknown component: ${requested}`);
}

const shape = unitShapes[unit];
const valuesPath = `${shape.chart}/values.yaml`;
const chartPath = `${shape.chart}/Chart.yaml`;
const version = requireEnv("VERSION");
const values = readFileSync(valuesPath, "utf8");

// Every image of a unit moves together, so the first answers for the rest.
const current = chartImageTag(values, shape.images[0]);

if (!isNewerRelease(current, version)) {
    console.log(`${unit} is already at ${current}, nothing to do`);
    process.exit(0);
}

const kind = classifyRelease(current, version);
const branch = bumpBranch(unit, version);

if (supersede(openPullRequests(), unit, version).standDown) {
    console.log(`A bump of ${unit} past ${version} is already open, nothing to do`);
    process.exit(0);
}

writeFileSync(
    valuesPath,
    shape.images.reduce((text, image) => setChartImageTag(text, image, version), values),
);
writeFileSync(chartPath, setChartAppVersion(readFileSync(chartPath, "utf8"), version));
writeFileSync(
    composePath,
    shape.images.reduce(
        (text, image) => setComposeImageTag(text, image, version),
        readFileSync(composePath, "utf8"),
    ),
);

const title = bumpTitle(unit, version, kind);
const appSlug = requireEnv("APP_SLUG");

run("git", ["config", "user.name", `${appSlug}[bot]`]);
run("git", ["config", "user.email", botEmail(appSlug)]);
run("git", ["switch", "-c", branch]);
run("git", ["commit", "-m", title, "--", valuesPath, chartPath, composePath]);
run("git", ["push", "--force", "origin", branch]);

const release = `https://github.com/eventail-scheduling/${shape.sourceRepository}/releases/tag/v${version}`;

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
// of the unit may have opened its own in the meantime, and of two such runs
// at least the later one sees both.
const supersession = supersede(openPullRequests(), unit, version);

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
