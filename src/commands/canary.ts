import { Command, flags } from '@oclif/command'
import { downloadEmberCanaryDoc } from '../lib/download-ember-canary-doc'
import { downloadEmberDataCanaryDoc } from '../lib/download-ember-data-canary-doc'

export default class Canary extends Command {
	static description = 'describe the command here'

	static flags = {
		help: flags.help({ char: 'h' }),
	}

	static args = [{ name: 'file' }]

	async run() {
		// const { args, flags } = this.parse(Canary)
		const emberDataCanaryDoc = await downloadEmberDataCanaryDoc(this.config)
		console.log(emberDataCanaryDoc)
		// const emberCanaryDoc = await downloadEmberCanaryDoc(this.config)		// console.log(emberCanaryDoc)
	}
}
