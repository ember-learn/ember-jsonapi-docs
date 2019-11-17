import { Command, flags } from '@oclif/command'
import * as SafePromise from 'bluebird'
import * as deepMerge from 'deepmerge'
import * as glob from 'glob'
import 'hard-rejection/register'
import * as prettyTime from 'pretty-time'
import { processProjectDoc } from '../lib/process-project-doc'
import readDocs from '../lib/read-docs'
import { revProjectDocs } from '../lib/rev-project-docs'
import { uploadDocsToS3 } from '../lib/s3-sync'
import saveDoc from '../lib/save-document'

const supportedProjects = ['ember', 'ember-data', 'ember-cli']

export default class FullRun extends Command {
	static description = 'Generates API docs for all versions of ember & ember-data'

	static flags = {
		help: flags.help({ char: 'h' }),

		publish: flags.boolean(),
	}

	static args = [{ name: 'projects', default: supportedProjects.join(',') }]

	async run() {
		const hrStartTime = process.hrtime()
		const { flags, args } = this.parse(FullRun)

		let projectsToProcess: string[] = args.projects.split(',').map((x: string) => x.trim())

		let invalidProjects = projectsToProcess.filter(
			(project: string) => !supportedProjects.includes(project)
		)

		if (invalidProjects.length > 0) {
			return this.error(
				`${invalidProjects.join(
					'\n'
				)} is an invalid arg. It should be one/many of ${supportedProjects.join(',')}`
			)
		}

		const getProjectFiles = (projectName: string) =>
			glob.sync(`node_modules/@ember-learn/released-js-docs/dist/${projectName}/*.json`)

		let docs: any = await readDocs(projectsToProcess, getProjectFiles)

		await SafePromise.mapSeries(projectsToProcess, projectName =>
			SafePromise.map(docs[projectName], doc => processProjectDoc(projectName, doc), {
				concurrency: 10,
			}).then(docs => saveDoc(deepMerge.all(docs), projectName))
		)

		await revProjectDocs(projectsToProcess)

		if (flags.publish) {
			await uploadDocsToS3()
		}

		let processExecTimeSummary = prettyTime(process.hrtime(hrStartTime))
		this.log(`Done in ${processExecTimeSummary}`)
	}
}
