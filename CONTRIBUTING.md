# Contributing to openclaw-hydradb

Welcome, and thank you for your interest in contributing to openclaw-hydradb. This project is an OpenClaw plugin for HydraDB that provides agentic memory with auto-capture, recall, and knowledge graph context, and we appreciate contributions of all kinds -- bug reports, documentation improvements, new features, and code reviews.

All participants in this project are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Developer Certificate of Origin (DCO)

This project uses the [Developer Certificate of Origin](https://developercertificate.org/) (DCO) instead of a Contributor License Agreement (CLA). The DCO is a lightweight mechanism that certifies you have the right to submit the code you are contributing. Every commit you submit **must** include a `Signed-off-by` line, and this requirement is enforced by CI.

### How to sign off your commits

Add the `-s` flag when committing:

```bash
git commit -s -m "feat: add new tool"
```

This appends a line like the following to your commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

The name and email must match your Git configuration. You can verify your settings with:

```bash
git config user.name
git config user.email
```

If you have already made commits without signing off, you can amend the most recent commit:

```bash
git commit --amend -s --no-edit
```

Or rebase to sign off multiple commits:

```bash
git rebase --signoff HEAD~N
```

where `N` is the number of commits to update.

**Commits without a valid `Signed-off-by` line will be rejected by CI and cannot be merged.**

For the full text of the DCO, see: https://developercertificate.org/

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [npm](https://www.npmjs.com/) (included with Node.js)
- Git

### Fork and clone

1. Fork the repository on GitHub.
2. Clone your fork locally:

```bash
git clone https://github.com/<your-username>/openclaw-hydradb.git
cd openclaw-hydradb
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/usecortex/openclaw-hydradb.git
```

### Set up the development environment

The fastest way to get a working environment is with `make`:

```bash
make bootstrap
```

This installs dependencies, runs the type checker, and copies the `.env` template. If you prefer to do it manually:

```bash
npm ci
```

### Configure environment variables

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` and set `HYDRA_OPENCLAW_API_KEY` and `HYDRA_OPENCLAW_TENANT_ID`. Never commit this file -- it is already in `.gitignore`.

### Verify your setup

Run the type checker to confirm everything compiles:

```bash
make check-types    # or: npm run check-types
```

If this completes without errors, your environment is ready.

---

## Branch Naming Convention

Create a new branch from `main` for every change. Use the following prefixes:

- `feat/` -- new features (e.g., `feat/batch-recall`)
- `fix/` -- bug fixes (e.g., `fix/capture-hook-error`)
- `docs/` -- documentation changes (e.g., `docs/update-readme`)
- `chore/` -- maintenance, CI, and tooling (e.g., `chore/update-dependencies`)

---

## Commit Message Format

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope): description
```

### Types

| Type       | Purpose                                  |
|------------|------------------------------------------|
| `feat`     | A new feature                            |
| `fix`      | A bug fix                                |
| `docs`     | Documentation-only changes               |
| `chore`    | Maintenance, CI, or tooling changes      |
| `refactor` | Code restructuring without behavior change |
| `test`     | Adding or updating tests                 |
| `perf`     | Performance improvements                 |

### Examples

```
feat(hooks): add batch capture support
fix(client): handle timeout on large uploads
docs(readme): add installation instructions for Windows
chore(ci): update TypeScript to v5.9
```

### Signing off

Every commit must include the DCO sign-off. A complete commit message looks like:

```
feat(hooks): add batch capture support

Implement batched capture for multiple memory entries in a single request.

Signed-off-by: Jane Developer <jane@example.com>
```

---

## Pull Request Guidelines

- **Reference an issue.** Every PR must reference an existing GitHub issue. If no issue exists for your change, create one first and wait for acknowledgment from a maintainer before starting work.
- **Fill out the PR template completely.** Do not delete sections from the template.
- **Keep PRs focused.** Each PR should contain one logical change. Avoid bundling unrelated fixes or features.
- **All CI checks must pass.** This includes type checking, building, and DCO verification.
- **At least one maintainer review is required** before any PR can be merged.
- **Rebase on `main` before requesting review.** Ensure your branch is up to date and has no merge conflicts:

```bash
git fetch upstream
git rebase upstream/main
```

---

## Code Style

- **TypeScript** is used throughout the project. Use type annotations on all exported function signatures.
- **Type checking** is enforced via `tsc --noEmit`. Run before committing:

```bash
npm run check-types
```

- **No hardcoded credentials.** API keys, tokens, and secrets must always come from environment variables. Never embed them in source code, configuration files, or tests.

---

## What We Will NOT Accept

To maintain project quality and protect contributors, the following will not be merged:

- PRs without a linked issue.
- Large dependency additions without prior discussion and approval in an issue.
- Breaking changes without an approved issue describing the rationale and migration path.
- Code that introduces hardcoded secrets or credentials.
- PRs that do not pass CI checks.
- Cosmetic-only changes (whitespace, formatting) unless they are part of a larger, substantive fix.

---

## First-Time Contributors

If this is your first contribution, here is how to get started:

1. **Find a good first issue.** Look for issues labeled [`good first issue`](https://github.com/usecortex/openclaw-hydradb/labels/good%20first%20issue) -- these are scoped, well-defined tasks suitable for newcomers.
2. **Read the README.** It contains an overview of the plugin architecture and how the components fit together.
3. **Ask questions.** If anything is unclear, open a thread in [GitHub Discussions](https://github.com/usecortex/openclaw-hydradb/discussions). There are no bad questions.

---

## Review Process

All pull requests go through code review before merging:

1. **At least one maintainer** will review every PR.
2. Reviews focus on **correctness**, **security**, and **alignment with project conventions**.
3. Maintainers may request changes. Address all review comments before re-requesting review.
4. Once a PR is approved and all CI checks pass, a maintainer will merge it.

Please be patient -- maintainers review on a best-effort basis. If your PR has not received a review within a reasonable time, a polite comment on the PR is welcome.

---

## Reporting Bugs and Requesting Features

### Bug reports

Use the **Bug Report** issue template. Include:

- A clear description of the problem.
- Steps to reproduce.
- Expected behavior versus actual behavior.
- Your environment (OS, Node.js version, relevant dependency versions).

### Feature requests

Use the **Feature Request** issue template. Include:

- The problem or use case your feature addresses.
- A proposed solution or approach.
- Any alternative approaches you considered.

**Before opening a new issue, search existing issues to avoid duplicates.**

---

## Thank You

Every contribution -- whether it is a bug report, a documentation fix, or a new feature -- makes openclaw-hydradb better. We appreciate your time and effort.
