import type { Hook } from '@oclif/core'
import { describeTopics } from '../project-commands.ts'

const hook: Hook.Init = async function () {
	await describeTopics(this.config, process.argv.slice(2))
}

export default hook
