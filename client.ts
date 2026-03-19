import { log } from "./log.ts"
import type {
	AddMemoryRequest,
	AddMemoryResponse,
	ConversationTurn,
	DeleteMemoryResponse,
	FetchContentRequest,
	FetchContentResponse,
	ListDataRequest,
	ListMemoriesResponse,
	ListSourcesResponse,
	RecallRequest,
	RecallResponse,
} from "./types/hydra.ts"

const API_BASE = "https://api.hydradb.com"
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

const INGEST_INSTRUCTIONS =
	"Focus on stable user preferences, habits, opinions, goals, and recurring " +
	"context that would help personalise future interactions. Capture high-level " +
	"biographical details only when they are clearly useful and not unusually " +
	"sensitive. Do not store secrets, credentials, access tokens, one-time codes, " +
	"financial account details, government IDs, private keys, or similarly " +
	"sensitive identifiers unless the user explicitly asks for them to be remembered."

function describeRequestPayload(payload: unknown): string {
	if (!payload || typeof payload !== "object") return "no payload"

	const record = payload as Record<string, unknown>

	if (Array.isArray(record.memories)) {
		let turnCount = 0
		let characterCount = 0

		for (const memory of record.memories) {
			if (!memory || typeof memory !== "object") continue
			const item = memory as Record<string, unknown>

			if (typeof item.text === "string") {
				characterCount += item.text.length
			}

			if (!Array.isArray(item.user_assistant_pairs)) continue
			turnCount += item.user_assistant_pairs.length

			for (const turn of item.user_assistant_pairs) {
				if (!turn || typeof turn !== "object") continue
				const pair = turn as Record<string, unknown>
				if (typeof pair.user === "string") characterCount += pair.user.length
				if (typeof pair.assistant === "string") {
					characterCount += pair.assistant.length
				}
			}
		}

		return `memories=${record.memories.length} turns=${turnCount} chars=${characterCount}`
	}

	if (typeof record.query === "string") {
		return `queryChars=${record.query.length} maxResults=${String(record.max_results ?? "default")} mode=${String(record.mode ?? "default")} graph=${String(record.graph_context ?? true)}`
	}

	if (typeof record.source_id === "string") {
		return `sourceId=${record.source_id} mode=${String(record.mode ?? "content")}`
	}

	if (typeof record.kind === "string") {
		return `kind=${record.kind}`
	}

	return `keys=${Object.keys(record).join(",")}`
}

export class HydraClient {
	private apiKey: string
	private tenantId: string
	private subTenantId: string
	private requestTimeoutMs: number

	constructor(
		apiKey: string,
		tenantId: string,
		subTenantId: string,
		opts?: { requestTimeoutMs?: number },
	) {
		this.apiKey = apiKey
		this.tenantId = tenantId
		this.subTenantId = subTenantId
		this.requestTimeoutMs =
			opts?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
	}

	private headers(): Record<string, string> {
		return {
			Authorization: `Bearer ${this.apiKey}`,
			"Content-Type": "application/json",
		}
	}

	private async request<T>(
		method: "DELETE" | "POST",
		path: string,
		opts?: {
			body?: unknown
			params?: Record<string, string>
		},
	): Promise<T> {
		const qs = opts?.params
			? `?${new URLSearchParams(opts.params).toString()}`
			: ""
		const url = `${API_BASE}${path}${qs}`
		const controller = new AbortController()
		const timeout = setTimeout(
			() => controller.abort(),
			this.requestTimeoutMs,
		)

		log.debug(`${method} ${path} ${describeRequestPayload(opts?.body ?? opts?.params)}`)

		try {
			const res = await fetch(url, {
				method,
				signal: controller.signal,
				body: opts?.body ? JSON.stringify(opts.body) : undefined,
				headers: this.headers(),
			})
			if (!res.ok) {
				const text = await res.text().catch(() => "")
				throw new Error(`Hydra ${path} → ${res.status}: ${text}`)
			}
			return res.json() as Promise<T>
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") {
				throw new Error(
					`Hydra ${path} timed out after ${this.requestTimeoutMs}ms`,
				)
			}
			throw err
		} finally {
			clearTimeout(timeout)
		}
	}

	private async post<T>(path: string, body: unknown): Promise<T> {
		return this.request<T>("POST", path, { body })
	}

	private async del<T>(path: string, params: Record<string, string>): Promise<T> {
		return this.request<T>("DELETE", path, { params })
	}

	// --- Ingest ---

	async ingestConversation(
		turns: ConversationTurn[],
		sourceId: string,
		opts?: {
			userName?: string
			metadata?: Record<string, unknown>
		},
	): Promise<AddMemoryResponse> {
		const payload: AddMemoryRequest = {
			memories: [
				{
					user_assistant_pairs: turns,
					infer: true,
					source_id: sourceId,
					user_name: opts?.userName ?? "User",
					custom_instructions: INGEST_INSTRUCTIONS,
					...(opts?.metadata && {
						document_metadata: JSON.stringify(opts.metadata),
					}),
				},
			],
			tenant_id: this.tenantId,
			sub_tenant_id: this.subTenantId,
			upsert: true,
		}
		return this.post<AddMemoryResponse>("/memories/add_memory", payload)
	}

	async ingestText(
		text: string,
		opts?: {
			sourceId?: string
			title?: string
			infer?: boolean
			isMarkdown?: boolean
			customInstructions?: string
		},
	): Promise<AddMemoryResponse> {
		const shouldInfer = opts?.infer ?? true
		const payload: AddMemoryRequest = {
			memories: [
				{
					text,
					infer: shouldInfer,
					is_markdown: opts?.isMarkdown ?? false,
					...(shouldInfer && {
						custom_instructions: opts?.customInstructions ?? INGEST_INSTRUCTIONS,
					}),
					...(opts?.sourceId && { source_id: opts.sourceId }),
					...(opts?.title && { title: opts.title }),
				},
			],
			tenant_id: this.tenantId,
			sub_tenant_id: this.subTenantId,
			upsert: true,
		}
		return this.post<AddMemoryResponse>("/memories/add_memory", payload)
	}

	// --- Recall ---

	async recall(
		query: string,
		opts?: {
			maxResults?: number
			mode?: "fast" | "thinking"
			graphContext?: boolean
			recencyBias?: number
		},
	): Promise<RecallResponse> {
		const payload: RecallRequest = {
			tenant_id: this.tenantId,
			sub_tenant_id: this.subTenantId,
			query,
			max_results: opts?.maxResults ?? 10,
			mode: opts?.mode ?? "thinking",
			alpha: 0.8,
			recency_bias: opts?.recencyBias ?? 0,
			graph_context: opts?.graphContext ?? true,
		}
		return this.post<RecallResponse>("/recall/recall_preferences", payload)
	}

	// --- List ---

	async listMemories(): Promise<ListMemoriesResponse> {
		const payload: ListDataRequest = {
			tenant_id: this.tenantId,
			sub_tenant_id: this.subTenantId,
			kind: "memories",
		}
		return this.post<ListMemoriesResponse>("/list/data", payload)
	}

	async listSources(sourceIds?: string[]): Promise<ListSourcesResponse> {
		const payload: ListDataRequest = {
			tenant_id: this.tenantId,
			sub_tenant_id: this.subTenantId,
			kind: "memories",
			...(sourceIds && { source_ids: sourceIds }),
		}
		return this.post<ListSourcesResponse>("/list/data", payload)
	}

	// --- Delete ---

	async deleteMemory(memoryId: string): Promise<DeleteMemoryResponse> {
		return this.del<DeleteMemoryResponse>("/memories/delete_memory", {
			tenant_id: this.tenantId,
			memory_id: memoryId,
			sub_tenant_id: this.subTenantId,
		})
	}

	// --- Fetch Content ---

	async fetchContent(
		sourceId: string,
		mode: "content" | "url" | "both" = "content",
	): Promise<FetchContentResponse> {
		const payload: FetchContentRequest = {
			tenant_id: this.tenantId,
			sub_tenant_id: this.subTenantId,
			source_id: sourceId,
			mode,
		}
		return this.post<FetchContentResponse>("/fetch/content", payload)
	}

	// --- Accessors ---

	getTenantId(): string {
		return this.tenantId
	}

	getSubTenantId(): string {
		return this.subTenantId
	}
}
