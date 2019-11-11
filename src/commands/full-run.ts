import { Command, flags } from '@oclif/command'
import * as SafePromise from 'bluebird'
import * as deepmerge from 'deepmerge'
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
	}

	static args = [{ name: 'file' }]

	async run() {
		const hrstart = process.hrtime()

		let docs = await readDocs(supportedProjects)

		await SafePromise.mapSeries(supportedProjects, projectName =>
			SafePromise.map(docs[projectName], doc => processProjectDoc(projectName, doc), {
				concurrency: 10,
			}).then(docs => saveDoc(deepmerge.all(docs), projectName))
		)

		await revProjectDocs(supportedProjects)

		await uploadDocsToS3()

		let processExecTimeSummary = prettyTime(process.hrtime(hrstart))
		console.info(`Done in ${processExecTimeSummary}`)
	}
}
