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
- **Scope:** optional, and one of `chart`, `compose`, `eventail`,
  `furry-schedule-adapter`, `deps`, `deps-dev`. `chart` and `compose` say which setup a
  change touches, and are the ones to reach for by hand; leave the scope out when a change spans
  both or neither. `eventail` and `furry-schedule-adapter` name a release unit and are what the
  release pull requests carry, so release-please's titles pass this check. `deps` and
  `deps-dev` are for dependency updates.
- **Body:** lines of at most 100 characters. Say why the change is made; the diff shows what
  changed.

## Pull requests

Checks lint both charts, validate their rendered manifests, the compose file and the workflows,
and install the eventail chart into a kind cluster against the services in
`ci/dependencies.yaml`. The adapter chart is linted and rendered but not installed: it
authenticates against an OpenID provider, so a meaningful install needs the eventail chart
running first and a provider the adapter will accept. The release scripts in `scripts/` are
type-checked and tested: run `pnpm typecheck` and `pnpm test`.

## Releases

Each chart has its own version, changelog and release pull request, driven by the commit
messages that touch it: `charts/eventail/CHANGELOG.md` and
`charts/eventail-furry-schedule-adapter/CHANGELOG.md`. Merging one tags that chart and pushes it
to `oci://ghcr.io/eventail-scheduling/charts`. Leave versions and changelogs to release-please.
The compose setup is not versioned.

Two things release upstream, and each maps to one chart: `eventail`, which publishes the api and
web images together, and `furry-schedule-adapter`, which publishes one. When either releases,
the Bump workflow opens a pull request moving every image of that unit and the chart's
`appVersion`, typed by what the release is: `fix` for a patch, `feat` for a minor from 1.0 on,
and `feat!` for a breaking release (below 1.0 a new minor version, from 1.0 on a new major one).
It merges itself once the checks pass, unless it is breaking. The chart release pull requests
follow the same rule.

A chart's `version` is its own and release-please owns it. Its `appVersion` names the release it
deploys and the bump pipeline owns it. They move for different reasons and from different pull
requests.

## License

Contributions are licensed under the [Apache License 2.0](LICENSE), the same as the project, as
its section 5 sets out.
