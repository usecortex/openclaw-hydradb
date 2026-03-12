import type { HydraClient } from "../client.ts"
import type { HydraPluginConfig } from "../config.ts"
import { log } from "../log.ts"
import { extractAllTurns, filterIgnoredTurns } from "../messages.ts"
import { toHookSourceId } from "../session.ts"
import type { ConversationTurn } from "../types/hydra.ts"

const MAX_HOOK_TURNS = -1

function removeInjectedBlocks(text: string): string {
	return text.replace(/<hydra-context>[\s\S]*?<\/hydra-context>\s*/g, "").trim()
}

export function createIngestionHook(
	client: HydraClient,
	cfg: HydraPluginConfig,
) {
	return async (event: Record<string, unknown>, sessionId: string | undefined) => {
		try {
			log.debug(`[capture] hook fired — success=${event.success} msgs=${Array.isArray(event.messages) ? event.messages.length : "N/A"} sid=${sessionId ?? "none"}`)

			if (!event.success) {
				log.debug("[capture] skipped — event.success is falsy")
				return
			}
			if (!Array.isArray(event.messages) || event.messages.length === 0) {
				log.debug("[capture] skipped — no messages in event")
				return
			}

			if (!sessionId) {
				log.debug("[capture] skipped — no session id available")
				return
			}

			const rawTurns = extractAllTurns(event.messages)
			const allTurns = filterIgnoredTurns(rawTurns, cfg.ignoreTerm)

			if (rawTurns.length > 0 && allTurns.length < rawTurns.length) {
				log.debug(`[capture] filtered ${rawTurns.length - allTurns.length} turns containing ignore term "${cfg.ignoreTerm}"`)
			}

			if (allTurns.length === 0) {
				log.debug(`[capture] skipped — no user-assistant turns found in ${event.messages.length} messages`)
				const roles = event.messages
					.slice(-5)
					.map((m) => (m && typeof m === "object" ? (m as Record<string, unknown>).role : "?"))
				log.debug(`[capture] last 5 message roles: ${JSON.stringify(roles)}`)
				return
			}

			const recentTurns = MAX_HOOK_TURNS === -1 ? allTurns : allTurns.slice(-MAX_HOOK_TURNS) 
			const turns: ConversationTurn[] = recentTurns.map((t) => ({
				user: removeInjectedBlocks(t.user),
				assistant: removeInjectedBlocks(t.assistant),
			})).filter((t) => t.user.length >= 5 && t.assistant.length >= 5)

			if (turns.length === 0) {
				log.debug("[capture] skipped — all turns too short after cleaning")
				return
			}

			const sourceId = toHookSourceId(sessionId)

			const now = new Date()
			const timestamp = now.toISOString()
			const readableTime = now.toLocaleString("en-US", {
				weekday: "short",
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				timeZoneName: "short",
			})

			const annotatedTurns = turns.map((t, i) => ({
				user: i === 0 ? `[Temporal details: ${readableTime}]\n\n${t.user}` : t.user,
				assistant: t.assistant,
			}))

			log.debug(`[capture] ingesting ${annotatedTurns.length} turns (of ${allTurns.length} total) @ ${timestamp} -> ${sourceId}`)

			await client.ingestConversation(
				annotatedTurns,
				sourceId,
				{
					metadata: {
						captured_at: timestamp,
						source: "openclaw_hook",
						turn_count: annotatedTurns.length,
					},
				},
			)

			log.debug("[capture] ingestion succeeded")
		} catch (err) {
			log.error("[capture] hook error", err)
		}
	}
}
