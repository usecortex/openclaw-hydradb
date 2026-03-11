export type LoggerBackend = {
	info(msg: string): void
	warn(msg: string): void
	error(msg: string): void
	debug?(msg: string): void
}

const TAG = "[hydra-db]"

let _backend: LoggerBackend | null = null
let _debug = false

export const log = {
	init(backend: LoggerBackend, debug: boolean) {
		_backend = backend
		_debug = debug
	},

	setDebug(enabled: boolean) {
		_debug = enabled
	},

	info(...args: unknown[]) {
		const msg = `${TAG} ${args.map(String).join(" ")}`
		if (_backend) _backend.info(msg)
		else console.log(msg)
	},

	warn(...args: unknown[]) {
		const msg = `${TAG} ${args.map(String).join(" ")}`
		if (_backend) _backend.warn(msg)
		else console.warn(msg)
	},

	error(...args: unknown[]) {
		const msg = `${TAG} ${args.map(String).join(" ")}`
		if (_backend) _backend.error(msg)
		else console.error(msg)
	},

	debug(...args: unknown[]) {
		if (!_debug) return
		const msg = `${TAG} ${args.map(String).join(" ")}`
		if (_backend?.debug) _backend.debug(msg)
		else if (_backend) _backend.info(msg)
		else console.debug(msg)
	},
}
