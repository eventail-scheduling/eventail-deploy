# Contributing

## Setup

`pnpm install` installs the Git hooks. Each commit message is checked against the conventions
below. Pull requests get the same check on their title and every commit.

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
install the chart into a kind cluster against the services in `ci/dependencies.yaml`.

## Releases

The chart's version and `charts/eventail/CHANGELOG.md` come from the commit messages that touch
the chart: release-please keeps a release pull request open, and merging it tags the release and
pushes the chart to `oci://ghcr.io/eventail-scheduling/charts`. Leave the version and the
changelog to it. The compose setup is not versioned.

## License

Contributions are licensed under the [Apache License 2.0](LICENSE), the same as the project, as
its section 5 sets out.
