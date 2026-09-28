# Contributing

## Setup

`pnpm install` installs the Git hooks. Before each commit, Biome checks and formats the staged
scripts and JSON files; each commit message is checked against the conventions below. Pull
requests get the same check on their title and every commit.

## Commit messages

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
`type(scope): subject`, for example `fix(chart): mount a writable /tmp for the web container`.

- **Type:** `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`,
  `style` or `test`.
- **Scope:** optional, and one of `chart`, `compose`, `deps`, `deps-dev`. Leave it out when a
  change spans both setups or touches neither. `deps` and `deps-dev` are for dependency updates.
- **Body:** lines of at most 100 characters. Say why the change is made; the diff shows what
  changed.

## Pull requests

Checks lint the chart, validate its rendered manifests, the compose file and the workflows, and
install the chart into a kind cluster against the services in `ci/dependencies.yaml`. The release
scripts in `scripts/` are type-checked and tested: run `pnpm typecheck` and `pnpm test`.

## Releases

The chart's version and `charts/eventail/CHANGELOG.md` come from the commit messages that touch
the chart: release-please keeps a release pull request open, and merging it tags the release and
pushes the chart to `oci://ghcr.io/eventail-scheduling/charts`. Leave the version and the
changelog to it. The compose setup is not versioned.

When the api or the web app publishes a release, the Bump workflow opens a pull request moving
both setups to the new image, typed by what the release is: `fix` for a patch, `feat` for a minor
from 1.0 on, and `feat!` for a breaking release (below 1.0 a new minor version, from 1.0 on a new
major one). It merges itself once the checks pass, unless it is breaking. The chart's release pull
request follows the same rule.

## License

Contributions are licensed under the [Apache License 2.0](LICENSE), the same as the project, as
its section 5 sets out.
