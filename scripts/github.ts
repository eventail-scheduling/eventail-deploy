import { execFileSync } from "node:child_process";
import type { OpenPullRequest } from "./bumps.ts";

export const run = (command: string, args: string[]): string =>
    execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();

const gh = (args: string[]): string => run("gh", args);

export const openPullRequests = (): OpenPullRequest[] =>
    JSON.parse(
        gh(["pr", "list", "--state", "open", "--limit", "1000", "--json", "number,headRefName"]),
    );

export const hasOpenPullRequest = (branch: string): boolean => {
    const open: unknown[] = JSON.parse(
        gh(["pr", "list", "--head", branch, "--state", "open", "--json", "number"]),
    );

    return open.length > 0;
};

export const createPullRequest = (branch: string, title: string, body: string): void => {
    gh(["pr", "create", "--head", branch, "--title", title, "--body", body]);
};

export const closePullRequest = (pullRequest: string, comment: string): void => {
    gh(["pr", "close", pullRequest, "--delete-branch", "--comment", comment]);
};

/**
 * Never merges on the spot, unlike `gh pr merge --auto`.
 *
 * gh merges at once whenever the pull request is already mergeable, which
 * without required checks means before any check has run. The mutation only
 * enables auto-merge, and GitHub refuses it when the branch has no
 * requirements to wait for.
 */
export const enableAutoMerge = (pullRequest: string): void => {
    const id = gh(["pr", "view", pullRequest, "--json", "id", "--jq", ".id"]);
    gh([
        "api",
        "graphql",
        "-f",
        "query=mutation($id: ID!) { enablePullRequestAutoMerge(input: {pullRequestId: $id, mergeMethod: SQUASH}) { clientMutationId } }",
        "-f",
        `id=${id}`,
    ]);
};

export const disableAutoMerge = (pullRequest: string): void => {
    const enabled = gh([
        "pr",
        "view",
        pullRequest,
        "--json",
        "autoMergeRequest",
        "--jq",
        ".autoMergeRequest != null",
    ]);

    if (enabled === "true") {
        gh(["pr", "merge", pullRequest, "--disable-auto"]);
    }
};

export const botEmail = (appSlug: string): string => {
    const id = gh(["api", `/users/${appSlug}%5Bbot%5D`, "--jq", ".id"]);
    return `${id}+${appSlug}[bot]@users.noreply.github.com`;
};
