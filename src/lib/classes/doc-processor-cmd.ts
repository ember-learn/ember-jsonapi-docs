import { Command, flags } from '@oclif/command'
import * as rmfr from 'rmfr'

import { AppStore } from './app-store'

export abstract class DocProcessorCmd extends Command {
	static flags = {
		help: flags.help({ char: 'h' }),

		publish: flags.boolean({ description: 'publishes the content to s3' }),

		s3Url: flags.string({
			description: 's3 url to publish the contents to',
			default: 's3://api-docs.emberjs.com/next-gen',
		}),

		clean: flags.boolean({
			description: 'cleans the data directory before running the command',
		}),
	}

	// const supportedProjects = ['ember', 'ember-data', 'ember-cli']
	static supportedProjects = ['ember', 'ember-data']

	static args = [{ name: 'projects', default: DocProcessorCmd.supportedProjects.join(',') }]

	async init() {
		let { flags } = this.parse(DocProcessorCmd)

		AppStore.init(this.config)

		if (flags.clean) {
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
