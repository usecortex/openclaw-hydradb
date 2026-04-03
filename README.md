# Hydra DB — OpenClaw Plugin

State-of-the-art agentic memory for OpenClaw powered by [Hydra DB](https://hydradb.com). Automatically captures conversations, recalls relevant context with knowledge-graph connections, and injects them before every AI turn.

## Install

```bash
openclaw plugins install @hydra_db/openclaw
```

Restart OpenClaw after installing.

If you run OpenClaw via the local gateway, restart it too:

```bash
openclaw gateway restart
```

## Get Your Credentials
1. Get your Hydra API Key from [Hydra DB](https://app.hydradb.com)
2. Get your Tenant ID from the Hydra dashboard

## Interactive Onboarding

Run the interactive CLI wizard (recommended):

```bash
# Basic onboarding (API key, tenant ID, sub-tenant, ignore term)
openclaw hydra onboard

# Advanced onboarding (all options including recall mode, graph context, etc.)
openclaw hydra onboard --advanced
```

The wizard guides you through configuration with colored prompts and **writes your config to** `plugins.entries.openclaw.config` inside OpenClaw's settings file.

The path is resolved in the same order OpenClaw itself uses:

1. `$OPENCLAW_CONFIG_PATH` — if set, used directly
2. `$OPENCLAW_STATE_DIR/openclaw.json` — if `OPENCLAW_STATE_DIR` is set
3. `$OPENCLAW_HOME/.openclaw/openclaw.json` — if `OPENCLAW_HOME` is set
4. Default: `~/.openclaw/openclaw.json` (macOS/Linux) or `%USERPROFILE%\.openclaw\openclaw.json` (Windows)

No manual adjustment needed — the wizard auto-detects the correct path.

After onboarding, restart the gateway:

```bash
openclaw gateway restart
```

## Manual Configuration

If you prefer, you can configure credentials manually.

Two required values:

- **API key**
- **Tenant ID**

Environment variables (recommended for secrets):

```bash
export HYDRA_OPENCLAW_API_KEY="your-api-key"
export HYDRA_OPENCLAW_TENANT_ID="your-tenant-id"
```

Or configure directly in OpenClaw's settings file:

- **macOS / Linux:** `~/.openclaw/openclaw.json`
- **Windows:** `%USERPROFILE%\.openclaw\openclaw.json`

```json5
{
  "plugins": {
    "entries": {
      "openclaw": {
        "enabled": true,
        "config": {
          "apiKey": "${HYDRA_OPENCLAW_API_KEY}",
          "tenantId": "${HYDRA_OPENCLAW_TENANT_ID}"
        }
      }
    }
  }
}
```

After changing config, restart the gateway so the plugin reloads:

```bash
openclaw gateway restart
```

### Options

| Key                  | Type        | Default               | Description                                                                    |
| -------------------- | ----------- | --------------------- | ------------------------------------------------------------------------------ |
| `subTenantId`      | `string`  | `"hydra-openclaw-plugin"` | Sub-tenant for data partitioning within your tenant                      |
| `autoRecall`       | `boolean` | `true`              | Inject relevant memories before every AI turn                                  |
| `autoCapture`      | `boolean` | `true`              | Store conversation exchanges after every AI turn                               |
| `maxRecallResults` | `number`  | `10`                | Max memory chunks injected into context per turn                               |
| `recallMode`       | `string`  | `"fast"`            | `"fast"` or `"thinking"` (deeper personalised recall with graph traversal) |
| `graphContext`     | `boolean` | `true`              | Include knowledge graph relations in recalled context                          |
| `ignoreTerm`       | `string`  | `"hydra-ignore"`    | Messages containing this term are excluded from recall & capture              |
| `debug`            | `boolean` | `false`             | Verbose debug logs                                                             |

## How It Works

- **Auto-Recall** — Before every AI turn, queries Hydra (`/recall/recall_preferences`) for relevant memories and injects graph-enriched context (entity paths, chunk relations, extra context).
- **Auto-Capture** — After every AI turn, the last user/assistant exchange is sent to Hydra (`/memories/add_memory`) as conversation pairs with `infer: true` and `upsert: true`. The session ID is used as `source_id` so Hydra groups exchanges per session and builds a knowledge graph automatically.

## Slash Commands

| Command                     | Description                           |
| --------------------------- | ------------------------------------- |
| `/hydra-onboard`          | Show current configuration status     |
| `/hydra-remember <text>` | Save something to Hydra memory       |
| `/hydra-recall <query>`  | Search memories with relevance scores |
| `/hydra-list`            | List all stored user memories         |
| `/hydra-delete <id>`     | Delete a specific memory by its ID    |
| `/hydra-get <source_id>` | Fetch the full content of a source    |

## AI Tools

| Tool                   | Description |
| ---------------------- | ----------- |
| `hydra_store`         | Save the recent conversation history to Hydra as memory |
| `hydra_search`        | Search Hydra memories (returns graph-enriched context) |
| `hydra_list_memories` | List all stored user memories (IDs + summaries) |
| `hydra_get_content`   | Fetch full content for a specific `source_id` |
| `hydra_delete_memory` | Delete a memory by `memory_id` (use only when user explicitly asks) |

## CLI

```bash
openclaw hydra onboard             # Interactive onboarding wizard
openclaw hydra onboard --advanced  # Advanced onboarding wizard
openclaw hydra search <query>      # Search memories
openclaw hydra list                # List all user memories
openclaw hydra delete <id>         # Delete a memory
openclaw hydra get <source_id>     # Fetch source content
openclaw hydra status              # Show plugin configuration
```

## Troubleshooting

### `Not configured. Run openclaw hydra onboard`

This means the plugin is enabled, but credentials are missing.

Run:

```bash
openclaw hydra onboard
openclaw gateway restart
```

### CLI says a command is unknown

Update/restart the gateway so it reloads the plugin:

```bash
openclaw gateway restart
```

## Context Injection

Recalled context is injected inside `<hydra-context>` tags containing:

- **Entity Paths** — Knowledge graph paths connecting entities relevant to the query
- **Context Chunks** — Retrieved memory chunks with source titles, graph relations, and linked extra context

## Contributing / Developer Setup

To work on the plugin locally:

```bash
# One-command bootstrap: installs deps, runs type-check, creates .env
make bootstrap

# — or run the script directly —
bash scripts/bootstrap.sh
```

Copy `.env.example` to `.env` and fill in your Hydra credentials (the bootstrap
script does this automatically if `.env` doesn't exist yet):

```bash
cp .env.example .env
# Then edit .env with your HYDRA_OPENCLAW_API_KEY and HYDRA_OPENCLAW_TENANT_ID
```

### Available Make targets

| Target        | Description                                      |
| ------------- | ------------------------------------------------ |
| `make help`         | Show all available targets                 |
| `make bootstrap`    | Full project bootstrap (install + check)   |
| `make install`      | Install dependencies (`npm ci`)            |
| `make check-types`  | Run TypeScript type-checking               |
| `make test`         | Run tests (if configured)                  |
| `make clean`        | Remove `node_modules/` and `dist/`         |
