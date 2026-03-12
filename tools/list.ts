import { Type } from "@sinclair/typebox"
import type { OpenClawPluginApi } from "openclaw/plugin-sdk"
import type { HydraClient } from "../client.ts"
import type { HydraPluginConfig } from "../config.ts"
import { log } from "../log.ts"

export function registerListTool(
	api: OpenClawPluginApi,
	client: HydraClient,
	_cfg: HydraPluginConfig,
): void {
	api.registerTool(
		{
			name: "hydra_list_memories",
			label: "Hydra List Memories",
			description:
				"List all user memories stored in Hydra. Returns memory IDs and content summaries. Use this when the user asks what you remember about them or wants to see their stored information.",
			parameters: Type.Object({}),
			async execute(_toolCallId: string, _params: Record<string, never>) {
				log.debug("list tool: fetching all memories")

				const res = await client.listMemories()
				const memories = res.user_memories ?? []

				if (memories.length === 0) {
					return {
						content: [
							{
								type: "text" as const,
								text: "No memories stored yet.",
							},
						],
					}
				}

				const lines = memories.map((m, i) => {
					const preview =
						m.memory_content.length > 100
							? `${m.memory_content.slice(0, 100)}…`
							: m.memory_content
					return `${i + 1}. [ID: ${m.memory_id}]\n   ${preview}`
				})

				return {
					content: [
						{
							type: "text" as const,
							text: `Found ${memories.length} memories:\n\n${lines.join("\n\n")}`,
						},
					],
				}
			},
		},
		{ name: "hydra_list_memories" },
	)
}
