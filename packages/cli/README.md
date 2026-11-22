---
metadata:
    reviewed: 2026-11-21
---

# @lift/cli

Use `pnpm lift --help` to find commands for creating projects, checking files, and auditing builds. The CLI help describes each command and its options.

## Check

Checks run project conventions and the checks configured in `lift.config.ts`. See `Lift.FileCheck` in the [contract](src/contract/v1/lift.d.ts) for check settings.

## Audit

Build audits cover HTML, DOM size, Sass, and [Lighthouse](src/lighthouse/README.md). The HTML checker needs Java 11 or later and can fetch a runtime.

## Contract

The project contract defines the global `Lift` namespace, including `Lift.Config` for `lift.config.ts`. Its types are written to `lift.d.ts` at the project root. [Version 1 contract](src/contract/v1/lift.d.ts)

## Convention rules

Put `_conventions` in the folder its rules check.

## Project commands

To add a project-specific command, export a `Lift.Command` from a `.ts` file directly in a `_commands` folder under `src`. Lift derives the command name from the path.

## Skills and briefs

Skills describe workflows in `_skills/<name>/SKILL.md`. Briefs record context in `_briefs/<name>/BRIEF.md`.

## Built-in commands

For a built-in [oclif](https://oclif.io) command, extend `ProjectCommand` under `src/commands/` and register it in `src/commands.ts`.
