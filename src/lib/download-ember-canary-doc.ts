import download = require('download')
import * as fs from 'fs-extra'
import got from 'got'
import * as os from 'os'
import * as path from 'path'
import * as rmfr from 'rmfr'
import * as stream from 'stream'
import { promisify } from 'util'

const pipeline = promisify(stream.pipeline)

export const downloadEmberCanaryDoc = async (config: any): Promise<string> => {
	let baseUrl = 'https://s3.amazonaws.com/builds.emberjs.com'

	let { assetPath } = await got(`${baseUrl}/canary.json`, {
		resolveBodyOnly: true,
		responseType: 'json',
	})

	const tmpFolder = fs.mkdtempSync(path.join(os.tmpdir(), config.name))

	const downloadPath = `${tmpFolder}/canary/ember/`
	await fs.mkdirp(downloadPath)

	await download(`${baseUrl}${assetPath}`, downloadPath, { extract: true })

	const docFolder = `${config.dataDir}/canary/ember`
	const docFile = `${docFolder}/canary.json`

	fs.moveSync(`${downloadPath}/package/docs/data.json`, docFile, { overwrite: true })

	await rmfr(tmpFolder)

	return docFile
}
