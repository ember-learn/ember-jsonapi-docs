import * as download from 'download'
import * as fs from 'fs-extra'
import * as os from 'os'
import * as path from 'path'
import * as request from 'request'
import * as rmfr from 'rmfr'
import { promisify } from 'util'

export const downloadEmberCanaryDoc = async (config: any): Promise<string> => {
	let baseUrl = 'https://s3.amazonaws.com/builds.emberjs.com'

	let { body } = await promisify(request.get)({ url: `/canary.json`, baseUrl, gzip: true })

	const { assetPath } = JSON.parse(body)

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
