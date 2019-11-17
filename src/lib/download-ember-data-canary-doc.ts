import * as download from 'download'
import * as fs from 'fs-extra'

export const downloadEmberDataCanaryDoc = async (config: any): Promise<string> => {
	const docFolder = `${config.dataDir}/canary/ember-data`
	const docFile = `${docFolder}/canary.json`

	const docUrl = `https://unpkg.com/ember-data@canary/dist/docs/data.json`

	if (!(await fs.pathExists(docFolder))) {
		await fs.mkdirp(docFolder)
	}

	await download(docUrl, docFolder, { filename: 'canary.json' })

	return docFile
}
