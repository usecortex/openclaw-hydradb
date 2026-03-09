# Cortex AI — OpenClaw Plugin

State-of-the-art agentic memory for OpenClaw powered by [Cortex AI](https://usecortex.ai). Automatically captures conversations, recalls relevant context with knowledge-graph connections, and injects them before every AI turn.

## Install

```bash
openclaw plugins install @usecortex_ai/openclaw-cortex-ai
```

Restart OpenClaw after installing.

If you run OpenClaw via the local gateway, restart it too:

```bash
openclaw gateway restart
```

## Get Your Credentials
1. Get your Cortex API Key from [Cortex AI](https://app.usecortex.ai)
2. Get your Tenant ID from the Cortex dashboard

## Interactive Onboarding

Run the interactive CLI wizard (recommended):

```bash
# Basic onboarding (API key, tenant ID, sub-tenant, ignore term)
openclaw cortex onboard

# Advanced onboarding (all options including recall mode, graph context, etc.)
openclaw cortex onboard --advanced
```

The wizard guides you through configuration with colored prompts and **writes your config to** `plugins.entries.openclaw-cortex-ai.config` inside OpenClaw's settings file.

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
export CORTEX_OPENCLAW_API_KEY="your-api-key"
export CORTEX_OPENCLAW_TENANT_ID="your-tenant-id"
```

Or configure directly in OpenClaw's settings file:

- **macOS / Linux:** `~/.openclaw/openclaw.json`
- **Windows:** `%USERPROFILE%\.openclaw\openclaw.json`

```json5
{
  "plugins": {
    "entries": {
      "openclaw-cortex-ai": {
        "enabled": true,
        "config": {
          "apiKey": "${CORTEX_OPENCLAW_API_KEY}",
          "tenantId": "${CORTEX_OPENCLAW_TENANT_ID}"
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
| `subTenantId`      | `string`  | `"cortex-openclaw-plugin"` | Sub-tenant for data partitioning within your tenant                      |
| `autoRecall`       | `boolean` | `true`              | Inject relevant memories before every AI turn                                  |
| `autoCapture`      | `boolean` | `true`              | Store conversation exchanges after every AI turn                               |
| `maxRecallResults` | `number`  | `10`                | Max memory chunks injected into context per turn                               |
| `recallMode`       | `string`  | `"fast"`            | `"fast"` or `"thinking"` (deeper personalised recall with graph traversal) |
| `graphContext`     | `boolean` | `true`              | Include knowledge graph relations in recalled context                          |
| `ignoreTerm`       | `string`  | `"cortex-ignore"`    | Messages containing this term are excluded from recall & capture              |
| `debug`            | `boolean` | `false`             | Verbose debug logs                                                             |

## How It Works

- **Auto-Recall** — Before every AI turn, queries Cortex (`/recall/recall_preferences`) for relevant memories and injects graph-enriched context (entity paths, chunk relations, extra context).
- **Auto-Capture** — After every AI turn, the last user/assistant exchange is sent to Cortex (`/memories/add_memory`) as conversation pairs with `infer: true` and `upsert: true`. The session ID is used as `source_id` so Cortex groups exchanges per session and builds a knowledge graph automatically.

## Slash Commands

| Command                     | Description                           |
| --------------------------- | ------------------------------------- |
| `/cortex-onboard`          | Show current configuration status     |
| `/cortex-remember <text>` | Save something to Cortex memory       |
| `/cortex-recall <query>`  | Search memories with relevance scores |
| `/cortex-list`            | List all stored user memories         |
| `/cortex-delete <id>`     | Delete a specific memory by its ID    |
| `/cortex-get <source_id>` | Fetch the full content of a source    |

## AI Tools

| Tool                   | Description |
| ---------------------- | ----------- |
| `cortex_store`         | Save the recent conversation history to Cortex as memory |
| `cortex_search`        | Search Cortex memories (returns graph-enriched context) |
| `cortex_list_memories` | List all stored user memories (IDs + summaries) |
| `cortex_get_content`   | Fetch full content for a specific `source_id` |
| `cortex_delete_memory` | Delete a memory by `memory_id` (use only when user explicitly asks) |

## CLI

```bash
openclaw cortex onboard             # Interactive onboarding wizard
openclaw cortex onboard --advanced  # Advanced onboarding wizard
openclaw cortex search <query>      # Search memories
openclaw cortex list                # List all user memories
openclaw cortex delete <id>         # Delete a memory
openclaw cortex get <source_id>     # Fetch source content
openclaw cortex status              # Show plugin configuration
```

## Troubleshooting

### `Not configured. Run openclaw cortex onboard`

This means the plugin is enabled, but credentials are missing.

Run:

```bash
openclaw cortex onboard
openclaw gateway restart
```

### CLI says a command is unknown

Update/restart the gateway so it reloads the plugin:

```bash
openclaw gateway restart
```

## Context Injection

Recalled context is injected inside `<cortex-context>` tags containing:

- **Entity Paths** — Knowledge graph paths connecting entities relevant to the query
- **Context Chunks** — Retrieved memory chunks with source titles, graph relations, and linked extra context
