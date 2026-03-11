import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { HydraClient } from "../client.ts"
import type { HydraPluginConfig } from "../config.ts"

export function registerCliCommands(
	api: OpenClawPluginApi,
	client: HydraClient,
	cfg: HydraPluginConfig,
	onboardingRegistrar?: (root: any) => void,
): void {
	api.registerCli(
		({ program }: { program: any }) => {
			const root = program
				.command("hydra")
				.description("Hydra DB memory commands")

			root
				.command("search")
				.argument("<query>", "Search query")
				.option("--limit <n>", "Max results", "10")
				.action(async (query: string, opts: { limit: string }) => {
					const limit = Number.parseInt(opts.limit, 10) || 10
					const res = await client.recall(query, {
						maxResults: limit,
						mode: cfg.recallMode,
						graphContext: cfg.graphContext,
					})

					if (!res.chunks || res.chunks.length === 0) {
						console.log("No memories found.")
						return
					}

					for (const chunk of res.chunks) {
						const score = chunk.relevancy_score != null
							? ` (${(chunk.relevancy_score * 100).toFixed(0)}%)`
							: ""
						const title = chunk.source_title ? `[${chunk.source_title}] ` : ""
						console.log(`- ${title}${chunk.chunk_content.slice(0, 200)}${score}`)
					}
				})

			root
				.command("list")
				.description("List all user memories")
				.action(async () => {
					const res = await client.listMemories()
					const memories = res.user_memories ?? []
					if (memories.length === 0) {
						console.log("No memories stored.")
						return
					}
					for (const m of memories) {
						console.log(`[${m.memory_id}] ${m.memory_content.slice(0, 150)}`)
					}
					console.log(`\nTotal: ${memories.length}`)
				})

			root
				.command("delete")
				.argument("<memory_id>", "Memory ID to delete")
				.action(async (memoryId: string) => {
					const res = await client.deleteMemory(memoryId)
					console.log(res.user_memory_deleted ? `Deleted: ${memoryId}` : `Not found: ${memoryId}`)
				})

			root
				.command("get")
				.argument("<source_id>", "Source ID to fetch")
				.action(async (sourceId: string) => {
					const res = await client.fetchContent(sourceId)
					if (!res.success || res.error) {
						console.error(`Error: ${res.error ?? "unknown"}`)
						return
					}
					console.log(res.content ?? res.content_base64 ?? "(no text content)")
				})

			root
				.command("status")
				.description("Show plugin configuration")
				.action(() => {
					console.log(`Tenant:       ${client.getTenantId()}`)
					console.log(`Sub-Tenant:   ${client.getSubTenantId()}`)
					console.log(`Auto-Recall:  ${cfg.autoRecall}`)
					console.log(`Auto-Capture: ${cfg.autoCapture}`)
					console.log(`Recall Mode:  ${cfg.recallMode}`)
					console.log(`Graph:        ${cfg.graphContext}`)
					console.log(`Max Results:  ${cfg.maxRecallResults}`)
					console.log(`Ignore Term:  ${cfg.ignoreTerm}`)
				})

			if (onboardingRegistrar) onboardingRegistrar(root)
		},
		{ commands: ["hydra"] },
	)
}
