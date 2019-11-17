import { Command, flags } from '@oclif/command'
import { downloadEmberCanaryDocs } from '../lib/download-ember-canary-docs'

export default class Canary extends Command {
	static description = 'describe the command here'

	static flags = {
		help: flags.help({ char: 'h' }),
	}

	static args = [{ name: 'file' }]

	async run() {
		// const { args, flags } = this.parse(Canary)
		const emberCanaryDoc = await downloadEmberCanaryDocs(this.config)
		console.log(emberCanaryDoc)
	}
}
