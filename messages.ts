import type { ConversationTurn } from "./types/hydra.ts"

const HYDRA_CONTEXT_BLOCK = /<hydra-context>[\s\S]*?<\/hydra-context>\s*/gi

export function containsIgnoreTerm(text: string, ignoreTerm: string): boolean {
	if (!ignoreTerm.trim()) return false
	return text.toLowerCase().includes(ignoreTerm.toLowerCase())
}

export function filterIgnoredTurns(
	turns: ConversationTurn[],
	ignoreTerm: string,
): ConversationTurn[] {
	return turns.filter(
		(t) =>
			!containsIgnoreTerm(t.user, ignoreTerm) &&
			!containsIgnoreTerm(t.assistant, ignoreTerm),
	)
}

function coerceText(value: unknown): string {
	if (typeof value === "string") return value
	if (value && typeof value === "object") {
		const record = value as Record<string, unknown>
		if (typeof record.value === "string") return record.value
		if (typeof record.text === "string") return record.text
		if (typeof record.content === "string") return record.content
	}
	return ""
}

function textFromContentPart(part: unknown): string {
	if (!part || typeof part !== "object") return ""

	const block = part as Record<string, unknown>
	const kind = typeof block.type === "string" ? block.type.toLowerCase() : ""
	if (kind && !kind.includes("text")) return ""

	return [
		coerceText(block.text),
		coerceText(block.value),
		coerceText(block.content),
	].find((text) => text.trim().length > 0) ?? ""
}

export function textFromMessage(msg: Record<string, unknown>): string {
	const content = msg.content
	if (typeof content === "string") return content.trim()
	if (content && typeof content === "object" && !Array.isArray(content)) {
		return textFromContentPart(content).trim()
	}
	if (Array.isArray(content)) {
		return content
			.map((part) => textFromContentPart(part))
			.filter((text) => text.length > 0)
			.join("\n")
			.trim()
	}
	return ""
}

export function stripInjectedHydraContext(text: string): string {
	return text.replace(HYDRA_CONTEXT_BLOCK, "").trim()
}

export function extractAllTurns(messages: unknown[]): ConversationTurn[] {
	const turns: ConversationTurn[] = []
	let currentUserParts: string[] = []
	let currentAssistantParts: string[] = []

	const flush = () => {
		const user = currentUserParts.join("\n\n").trim()
		const assistant = currentAssistantParts.join("\n\n").trim()
		if (user && assistant) {
			turns.push({ user, assistant })
		}
		currentUserParts = []
		currentAssistantParts = []
	}

	for (const msg of messages) {
		if (!msg || typeof msg !== "object") continue
		const m = msg as Record<string, unknown>
		const text = textFromMessage(m)

		if (m.role === "user") {
			if (!text) continue
			if (currentUserParts.length > 0 && currentAssistantParts.length > 0) {
				flush()
			}
			currentUserParts.push(text)
		} else if (m.role === "assistant") {
			if (!text || currentUserParts.length === 0) continue
			currentAssistantParts.push(text)
		}
	}

	if (currentUserParts.length > 0 && currentAssistantParts.length > 0) {
		flush()
	}

	return turns
}

export function getLatestTurn(messages: unknown[]): ConversationTurn | null {
	const turns = extractAllTurns(messages)
	return turns.length > 0 ? turns[turns.length - 1]! : null
}

export function getLatestUserMessage(messages: unknown[]): string | null {
	const parts: string[] = []

	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i]
		if (!m || typeof m !== "object") continue

		const msg = m as Record<string, unknown>
		const text = textFromMessage(msg)
		if (!text) continue

		if (msg.role === "user") {
			parts.unshift(text)
			continue
		}

		if (parts.length > 0) {
			break
		}
	}

	const combined = parts.join("\n\n").trim()
	return combined || null
}
