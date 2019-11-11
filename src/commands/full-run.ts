import { Command, flags } from '@oclif/command'
import * as SafePromise from 'bluebird'
import 'hard-rejection/register'
import * as prettyTime from 'pretty-time'
import { filler1 } from '../lib/filler1'
import { processProjectDoc } from '../lib/process-project-doc'
import readDocs from '../lib/read-docs'
import { revProjectDocs } from '../lib/rev-project-docs'
import { uploadDocsToS3 } from '../lib/s3-sync'
import { supportedProjects } from '../lib/supported-projects'

export default class FullRun extends Command {
	static description = 'describe the command here'

	static flags = {
		help: flags.help({ char: 'h' }),
		// // flag with a value (-n, --name=VALUE)
		// name: flags.string({ char: 'n', description: 'name to print' }),
		// // flag with no value (-f, --force)
		// force: flags.boolean({ char: 'f' }),
	}

	static args = [{ name: 'file' }]

	async run() {
		const hrstart = process.hrtime()

		let docs = await readDocs(supportedProjects)

		await SafePromise.mapSeries(supportedProjects, projectName =>
			SafePromise.map(docs[projectName], doc => processProjectDoc(projectName, doc), {
				concurrency: 10,
			}).then(docs => filler1(projectName, docs))
		)

		await revProjectDocs(supportedProjects)

		await uploadDocsToS3()

		let processExecTimeSummary = prettyTime(process.hrtime(hrstart))
		console.info(`Done in ${processExecTimeSummary}`)
	}
}
