export function basePath() {
	const path = process.env.BASE_PATH?.replace(/^\/+|\/+$/g, '')
	return path ? `/${path}/` : '/'
}
