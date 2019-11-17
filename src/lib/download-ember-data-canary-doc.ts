import * as download from 'download'
import * as fs from 'fs-extra'

export const downloadEmberDataCanaryDoc = async (config: any): Promise<string> => {
	const docFolder = `${config.dataDir}/canary/ember-data`

	if (!(await fs.pathExists(docFolder))) {
		await fs.mkdirp(docFolder)
	}

	const doc = await download(`https://unpkg.com/ember-data@canary/dist/docs/data.json`, docFolder)

	const {
		project: { version },
	} = JSON.parse(doc.toString('utf8'))

	const docFile = `${docFolder}/${version}.json`

	await fs.move(`${docFolder}/data.json`, docFile, { overwrite: true })

	return docFile
}
