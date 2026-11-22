const SALT = 'lift-origin-key'

function xorCipher(text: string) {
	let output = ''
	for (let i = 0; i < text.length; i++) {
		output += String.fromCharCode(
			text.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length),
		)
	}
	return output
}

export function getTraceToken(pageId: string) {
	const project = import.meta.env.__PROJECT_NAME__ || 'lift'
	const commit = import.meta.env.__GIT_COMMIT__ || 'local'
	return Buffer.from(xorCipher(`${project}:${pageId}:${commit}`), 'latin1').toString(
		'base64url',
	)
}

export function decodeTraceToken(token: string) {
	const [project, page, ...commit] = xorCipher(
		Buffer.from(token, 'base64url').toString('latin1'),
	).split(':')
	return commit.length > 0 ? { project, page, commit: commit.join(':') } : null
}
