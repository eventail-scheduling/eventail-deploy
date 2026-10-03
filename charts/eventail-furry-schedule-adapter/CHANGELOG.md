# Changelog

## [0.2.0](https://github.com/eventail-scheduling/eventail-deploy/compare/furry-schedule-adapter-v0.1.1...furry-schedule-adapter-v0.2.0) (2026-10-03)


### ⚠ BREAKING CHANGES

* update furry-schedule-adapter to 0.2.0 ([#14](https://github.com/eventail-scheduling/eventail-deploy/issues/14))

### Features

* **furry-schedule-adapter:** drop the venue settings, name the membership question ([4d25b4a](https://github.com/eventail-scheduling/eventail-deploy/commit/4d25b4a7b5b6a5f4c7cd05095ee123d7e6315d99))
* update furry-schedule-adapter to 0.2.0 ([#14](https://github.com/eventail-scheduling/eventail-deploy/issues/14)) ([1a83a68](https://github.com/eventail-scheduling/eventail-deploy/commit/1a83a68a5cfc216f78a949c7d6be1eec56150641))

## [0.1.1](https://github.com/eventail-scheduling/eventail-deploy/compare/furry-schedule-adapter-v0.1.0...furry-schedule-adapter-v0.1.1) (2026-10-02)


### Features

* **chart:** route with Gateway API, and expose the adapter at all ([a675536](https://github.com/eventail-scheduling/eventail-deploy/commit/a675536cf6081961fc66b787589023505656cec6))

## 0.1.0 (2026-10-02)

First release of the chart. Deploys the furry schedule adapter with a
persistent volume for its access token cache, against an Eventail API and an
OpenID Connect provider supplied by the operator.

Deploys the adapter 0.1.0, which `appVersion` tracks from here on.
