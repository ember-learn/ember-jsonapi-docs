import { Command, flags } from '@oclif/command'
import * as SafePromise from 'bluebird'
import * as deepmerge from 'deepmerge'
import * as glob from 'glob'
import 'hard-rejection/register'
import * as prettyTime from 'pretty-time'
import { processProjectDoc } from '../lib/process-project-doc'
import readDocs from '../lib/read-docs'
import { revProjectDocs } from '../lib/rev-project-docs'
import { uploadDocsToS3 } from '../lib/s3-sync'
import saveDoc from '../lib/save-document'
import { supportedProjects } from '../lib/supported-projects'

export default class FullRun extends Command {
	static description = 'Generates API docs for all versions of ember & ember-data'

	static flags = {
		help: flags.help({ char: 'h' }),
		publish: flags.boolean(),
	}

	async run() {
		const hrstart = process.hrtime()
		const { flags } = this.parse(FullRun)

		const getProjectFiles = (projectName: string) =>
			glob.sync(`node_modules/@ember-learn/released-js-docs/dist/${projectName}/*.json`)

		let docs: any = await readDocs(supportedProjects, getProjectFiles)

		await SafePromise.mapSeries(supportedProjects, projectName =>
			SafePromise.map(docs[projectName], doc => processProjectDoc(projectName, doc), {
				concurrency: 10,
			}).then(docs => saveDoc(deepmerge.all(docs), projectName))
		)

		await revProjectDocs(supportedProjects)

		if (flags.publish) {
			await uploadDocsToS3()
		}

		let processExecTimeSummary = prettyTime(process.hrtime(hrstart))
		console.info(`Done in ${processExecTimeSummary}`)
	}
}
