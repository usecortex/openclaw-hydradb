import type { HydraClient } from "../client.ts"
import type { HydraPluginConfig } from "../config.ts"
import { buildRecalledContext, envelopeForInjection } from "../context.ts"
import { log } from "../log.ts"
import { containsIgnoreTerm, getLatestUserMessage } from "../messages.ts"

function extractRecallQuery(
	event: Record<string, unknown>,
	getMessages: () => unknown[],
): string | null {
	const directPrompt =
		typeof event.prompt === "string" ? event.prompt.trim() : ""
	if (directPrompt.length >= 5) return directPrompt

	const directInput =
		typeof event.input === "string" ? event.input.trim() : ""
	if (directInput.length >= 5) return directInput

	const messages =
		Array.isArray(event.messages) && event.messages.length > 0
			? event.messages
			: getMessages()
	const latestUserMessage = getLatestUserMessage(messages)
	if (latestUserMessage && latestUserMessage.length >= 5) {
		return latestUserMessage
	}

	return null
}

export function createRecallHook(
	client: HydraClient,
	cfg: HydraPluginConfig,
	getMessages: () => unknown[],
) {
	return async (event: Record<string, unknown>) => {
		const prompt = extractRecallQuery(event, getMessages)
		if (!prompt) {
			log.debug("recall skipped — no prompt or user message available")
			return
		}

		if (containsIgnoreTerm(prompt, cfg.ignoreTerm)) {
			log.debug(`recall skipped — prompt contains ignore term "${cfg.ignoreTerm}"`)
			return
		}

		log.debug(`recall query (${prompt.length} chars)`)

		try {
			const response = await client.recall(prompt, {
				maxResults: cfg.maxRecallResults,
				mode: cfg.recallMode,
				graphContext: cfg.graphContext,
			})

			if (!response.chunks || response.chunks.length === 0) {
				log.debug("no memories matched")
				return
			}

			const body = buildRecalledContext(response)
			if (!body.trim()) return

			const envelope = envelopeForInjection(body)

			log.debug(`injecting ${response.chunks.length} chunks (${envelope.length} chars)`)
			return { prependContext: envelope }
		} catch (err) {
			log.error("recall failed", err)
			return
		}
	}
}
