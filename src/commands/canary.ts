import { Command, flags } from '@oclif/command'
import 'hard-rejection/register'
import * as prettyTime from 'pretty-time'
import { downloadEmberCanaryDoc } from '../lib/download-ember-canary-doc'
import { downloadEmberDataCanaryDoc } from '../lib/download-ember-data-canary-doc'

export default class Canary extends Command {
	static description = 'describe the command here'

	static flags = {
		help: flags.help({ char: 'h' }),
		publish: flags.boolean(),
	}

	async run() {
		const hrstart = process.hrtime()

		const { args, flags } = this.parse(Canary)
		const emberDataCanaryDoc = await downloadEmberDataCanaryDoc(this.config)

		const emberCanaryDoc = await downloadEmberCanaryDoc(this.config)

		if (flags.publish) {
			// await uploadDocsToS3()
		}

		let processExecTimeSummary = prettyTime(process.hrtime(hrstart))
		console.info(`Done in ${processExecTimeSummary}`)
	}
}
