import * as SafePromise from 'bluebird'
import * as deepMerge from 'deepmerge'
import * as glob from 'glob'
import 'hard-rejection/register'
import * as prettyTime from 'pretty-hrtime'

import { DocProcessorCmd } from '../lib/classes/doc-processor-cmd'
import { processProjectDoc } from '../lib/process-project-doc'
import readDocs from '../lib/read-docs'
import { revProjectDocs } from '../lib/rev-project-docs'
import { uploadDocsToS3 } from '../lib/s3-sync'
import saveDoc from '../lib/save-document'

export default class FullRun extends DocProcessorCmd {
	static description = 'Generates API docs for all versions of ember & ember-data'

	async run() {
		const hrStartTime = process.hrtime()
		const { flags } = this.parse(FullRun)

		const { projectsToProcess } = this

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
			await uploadDocsToS3(flags.s3Url)
		}

		let processExecTimeSummary = prettyTime(process.hrtime(hrStartTime))
		this.log(`Done in ${processExecTimeSummary}`)
	}
}
