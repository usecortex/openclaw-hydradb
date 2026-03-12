export type HydraPluginConfig = {
	apiKey: string
	tenantId: string
	subTenantId: string
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

function envOrNull(name: string): string | undefined {
	return typeof process !== "undefined" ? process.env[name] : undefined
}

function resolveEnvVars(value: string): string {
	return value.replace(/\$\{([^}]+)\}/g, (_, name: string) => {
		const val = envOrNull(name)
		if (!val) throw new Error(`Environment variable ${name} is not set`)
		return val
	})
}

export function parseConfig(raw: unknown): HydraPluginConfig {
	const cfg =
		raw && typeof raw === "object" && !Array.isArray(raw)
			? (raw as Record<string, unknown>)
			: {}

	const unknown = Object.keys(cfg).filter((k) => !KNOWN_KEYS.has(k))
	if (unknown.length > 0) {
		throw new Error(`hydra-db: unrecognized config keys: ${unknown.join(", ")}`)
	}

	const apiKey =
		typeof cfg.apiKey === "string" && cfg.apiKey.length > 0
			? resolveEnvVars(cfg.apiKey)
			: envOrNull("HYDRA_OPENCLAW_API_KEY")

	if (!apiKey) {
		throw new Error(
			"hydra-db: apiKey is required — set it in plugin config or via HYDRA_OPENCLAW_API_KEY env var",
		)
	}

	const tenantId =
		typeof cfg.tenantId === "string" && cfg.tenantId.length > 0
			? resolveEnvVars(cfg.tenantId)
			: envOrNull("HYDRA_OPENCLAW_TENANT_ID")

	if (!tenantId) {
		throw new Error(
			"hydra-db: tenantId is required — set it in plugin config or via HYDRA_OPENCLAW_TENANT_ID env var",
		)
	}

	const subTenantId =
		typeof cfg.subTenantId === "string" && cfg.subTenantId.length > 0
			? cfg.subTenantId
			: DEFAULT_SUB_TENANT

	return {
		apiKey,
		tenantId,
		subTenantId,
		autoRecall: (cfg.autoRecall as boolean) ?? true,
		autoCapture: (cfg.autoCapture as boolean) ?? true,
		maxRecallResults: (cfg.maxRecallResults as number) ?? 10,
		recallMode:
			cfg.recallMode === "thinking"
				? ("thinking" as const)
				: ("fast" as const),
		graphContext: (cfg.graphContext as boolean) ?? true,
		ignoreTerm:
			typeof cfg.ignoreTerm === "string" && cfg.ignoreTerm.length > 0
				? cfg.ignoreTerm
				: DEFAULT_IGNORE_TERM,
		debug: (cfg.debug as boolean) ?? false,
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

export const hydraConfigSchema = {
	parse: parseConfigSoft,
}
