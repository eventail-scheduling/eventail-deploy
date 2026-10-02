# Changelog

## [0.1.1](https://github.com/eventail-scheduling/eventail-deploy/compare/furry-schedule-adapter-v0.1.0...furry-schedule-adapter-v0.1.1) (2026-10-02)


### Features

* **chart:** route with Gateway API, and expose the adapter at all ([a675536](https://github.com/eventail-scheduling/eventail-deploy/commit/a675536cf6081961fc66b787589023505656cec6))

## 0.1.0 (2026-10-02)

First release of the chart. Deploys the furry schedule adapter with a
persistent volume for its access token cache, against an Eventail API and an
OpenID Connect provider supplied by the operator.

Deploys the adapter 0.1.0, which `appVersion` tracks from here on.
