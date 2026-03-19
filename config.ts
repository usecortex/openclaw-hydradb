export type HydraPluginConfig = {
	apiKey: string
	tenantId: string
	subTenantId: string
	requestTimeoutMs: number
	autoRecall: boolean
	autoCapture: boolean
	maxRecallResults: number
	recallMode: "fast" | "thinking"
	graphContext: boolean
	ignoreTerm: string
	debug: boolean
}

const KNOWN_KEYS = new Set([
	"apiKey",
	"tenantId",
	"subTenantId",
	"requestTimeoutMs",
	"autoRecall",
	"autoCapture",
	"maxRecallResults",
	"recallMode",
	"graphContext",
	"ignoreTerm",
	"debug",
])

const DEFAULT_SUB_TENANT = "hydra-openclaw-plugin"
const DEFAULT_IGNORE_TERM = "hydra-ignore"
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000

function envOrNull(name: string): string | undefined {
	const raw = typeof process !== "undefined" ? process.env[name] : undefined
	const trimmed = raw?.trim()
	return trimmed ? trimmed : undefined
}

function resolveEnvVars(value: string): string {
	return value.replace(/\$\{([^}]+)\}/g, (_, name: string) => {
		const val = envOrNull(name)
		if (!val) throw new Error(`Environment variable ${name} is not set`)
		return val
	})
}

function asConfigObject(raw: unknown): Record<string, unknown> {
	const cfg =
		raw && typeof raw === "object" && !Array.isArray(raw)
			? (raw as Record<string, unknown>)
			: {}

	const unknown = Object.keys(cfg).filter((k) => !KNOWN_KEYS.has(k))
	if (unknown.length > 0) {
		throw new Error(`hydra-db: unrecognized config keys: ${unknown.join(", ")}`)
	}

	return cfg
}

function parseOptionalString(
	value: unknown,
	name: string,
	opts?: { resolveEnv?: boolean },
): string | undefined {
	if (value === undefined) return undefined
	if (typeof value !== "string") {
		throw new Error(`hydra-db: ${name} must be a string`)
	}

	const resolved = opts?.resolveEnv ? resolveEnvVars(value) : value
	const trimmed = resolved.trim()
	return trimmed.length > 0 ? trimmed : undefined
}

function parseOptionalBoolean(value: unknown, name: string): boolean | undefined {
	if (value === undefined) return undefined
	if (typeof value !== "boolean") {
		throw new Error(`hydra-db: ${name} must be a boolean`)
	}
	return value
}

function parseOptionalNumber(
	value: unknown,
	name: string,
	opts?: { integer?: boolean; max?: number; min?: number },
): number | undefined {
	if (value === undefined) return undefined
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new Error(`hydra-db: ${name} must be a number`)
	}
	if (opts?.integer && !Number.isInteger(value)) {
		throw new Error(`hydra-db: ${name} must be an integer`)
	}
	if (opts?.min !== undefined && value < opts.min) {
		throw new Error(`hydra-db: ${name} must be >= ${opts.min}`)
	}
	if (opts?.max !== undefined && value > opts.max) {
		throw new Error(`hydra-db: ${name} must be <= ${opts.max}`)
	}
	return value
}

function parseOptionalRecallMode(
	value: unknown,
): HydraPluginConfig["recallMode"] | undefined {
	if (value === undefined) return undefined
	if (value !== "fast" && value !== "thinking") {
		throw new Error(`hydra-db: recallMode must be "fast" or "thinking"`)
	}
	return value
}

function validateOptionalConfigTypes(cfg: Record<string, unknown>): void {
	parseOptionalString(cfg.apiKey, "apiKey")
	parseOptionalString(cfg.tenantId, "tenantId")
	parseOptionalString(cfg.subTenantId, "subTenantId")
	parseOptionalNumber(cfg.requestTimeoutMs, "requestTimeoutMs", {
		integer: true,
		max: 120_000,
		min: 1_000,
	})
	parseOptionalBoolean(cfg.autoRecall, "autoRecall")
	parseOptionalBoolean(cfg.autoCapture, "autoCapture")
	parseOptionalNumber(cfg.maxRecallResults, "maxRecallResults", {
		integer: true,
		max: 50,
		min: 1,
	})
	parseOptionalRecallMode(cfg.recallMode)
	parseOptionalBoolean(cfg.graphContext, "graphContext")
	parseOptionalString(cfg.ignoreTerm, "ignoreTerm")
	parseOptionalBoolean(cfg.debug, "debug")
}

export function parseConfig(raw: unknown): HydraPluginConfig {
	const cfg = asConfigObject(raw)
	validateOptionalConfigTypes(cfg)

	const apiKey =
		parseOptionalString(cfg.apiKey, "apiKey", { resolveEnv: true }) ??
		envOrNull("HYDRA_OPENCLAW_API_KEY")

	if (!apiKey) {
		throw new Error(
			"hydra-db: apiKey is required — set it in plugin config or via HYDRA_OPENCLAW_API_KEY env var",
		)
	}

	const tenantId =
		parseOptionalString(cfg.tenantId, "tenantId", { resolveEnv: true }) ??
		envOrNull("HYDRA_OPENCLAW_TENANT_ID")

	if (!tenantId) {
		throw new Error(
			"hydra-db: tenantId is required — set it in plugin config or via HYDRA_OPENCLAW_TENANT_ID env var",
		)
	}

	return {
		apiKey,
		tenantId,
		subTenantId:
			parseOptionalString(cfg.subTenantId, "subTenantId") ??
			DEFAULT_SUB_TENANT,
		requestTimeoutMs:
			parseOptionalNumber(cfg.requestTimeoutMs, "requestTimeoutMs", {
				integer: true,
				max: 120_000,
				min: 1_000,
			}) ?? DEFAULT_REQUEST_TIMEOUT_MS,
		autoRecall: parseOptionalBoolean(cfg.autoRecall, "autoRecall") ?? true,
		autoCapture:
			parseOptionalBoolean(cfg.autoCapture, "autoCapture") ?? true,
		maxRecallResults:
			parseOptionalNumber(cfg.maxRecallResults, "maxRecallResults", {
				integer: true,
				max: 50,
				min: 1,
			}) ?? 10,
		recallMode: parseOptionalRecallMode(cfg.recallMode) ?? "fast",
		graphContext:
			parseOptionalBoolean(cfg.graphContext, "graphContext") ?? true,
		ignoreTerm:
			parseOptionalString(cfg.ignoreTerm, "ignoreTerm") ??
			DEFAULT_IGNORE_TERM,
		debug: parseOptionalBoolean(cfg.debug, "debug") ?? false,
	}
}

export function tryParseConfig(raw: unknown): HydraPluginConfig | null {
	try {
		return parseConfig(raw)
	} catch {
		return null
	}
}

/**
 * Permissive schema parse — validates key names but does NOT require credentials.
 * This lets the plugin load so the onboarding wizard can run.
 */
function parseConfigSoft(raw: unknown): Record<string, unknown> {
	const cfg = asConfigObject(raw)
	validateOptionalConfigTypes(cfg)
	return cfg
}

export const hydraConfigSchema = {
	parse: parseConfigSoft,
}
