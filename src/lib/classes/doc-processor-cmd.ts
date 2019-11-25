import { Command, flags } from '@oclif/command'
import * as rmfr from 'rmfr'

import { AppStore } from './app-store'

export default abstract class DocProcessorCmd extends Command {
	static flags = {
		help: flags.help({ char: 'h' }),

		publish: flags.boolean(),

		clear: flags.boolean(),
	}

	// const supportedProjects = ['ember', 'ember-data', 'ember-cli']
	static supportedProjects = ['ember', 'ember-data']

	static args = [{ name: 'projects', default: DocProcessorCmd.supportedProjects.join(',') }]

	async init() {
		AppStore.init(this.config)
		let {
			flags: { clear },
		} = this.parse(DocProcessorCmd)

		if (clear) {
			await rmfr(this.config.dataDir)
		}
	}

	get projectsToProcess() {
		let {
			args: { projects },
		} = this.parse(DocProcessorCmd)

		let projectsToProcess: string[] = projects.split(',').map((x: string) => x.trim())

		let invalidProjects = projectsToProcess.filter(
			(project: string) => !DocProcessorCmd.supportedProjects.includes(project)
		)

		if (invalidProjects.length > 0) {
			this.error(
				`${invalidProjects.join(
					'\n'
				)} is an invalid arg. It should be one/many of ${DocProcessorCmd.supportedProjects.join(
					','
				)}`
			)
		}

		return projectsToProcess
	}
}
