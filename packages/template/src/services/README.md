---
metadata:
    reviewed: 2026-11-22
---

# @services

Services manage page-wide behavior. Each service has one instance and can be enabled in `config.services`.

## The proxy

Use `@services` to access services from elsewhere in the project. The proxy exposes each service's exports and settings, and allows a service to be absent.

Use `services:proxy` for a service's Sass API. Create services from the [blueprint](_blueprints/README.md).
