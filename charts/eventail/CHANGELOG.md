# Changelog

## [0.2.0](https://github.com/eventail-scheduling/eventail-deploy/compare/eventail-v0.1.0...eventail-v0.2.0) (2026-10-02)


### ⚠ BREAKING CHANGES

* update eventail to 0.2.0 ([#13](https://github.com/eventail-scheduling/eventail-deploy/issues/13))

### Features

* **chart:** route with Gateway API, and expose the adapter at all ([a675536](https://github.com/eventail-scheduling/eventail-deploy/commit/a675536cf6081961fc66b787589023505656cec6))
* update eventail to 0.2.0 ([#13](https://github.com/eventail-scheduling/eventail-deploy/issues/13)) ([24702e2](https://github.com/eventail-scheduling/eventail-deploy/commit/24702e2c2d8dde9d43cbeae21982f079670d06c1))

## 0.1.0 (2026-10-02)

First release of the chart. Deploys the Eventail API, its background worker
and the web client, behind an optional ingress. Postgres, S3, SMTP and an
OpenID Connect provider are supplied by the operator.

Deploys Eventail 0.1.0, which `appVersion` tracks from here on.
