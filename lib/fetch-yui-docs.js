import compareVersions from 'compare-versions'
import download from 'download'
import fs from 'fs-extra'
import { isEmpty, trim } from 'lodash'
import mkdirp from 'mkdirp'
import pkgVersions from 'pkg-versions'
import { all, resolve } from 'rsvp'

let filterValidVersions = (specificDocsVersion, ignorePreviouslyIndexedDoc) => version => {
	let isCompatibleVersion = compareVersions(version, '3.4.1') !== -1 && !version.includes('beta')

	if (!isEmpty(trim(specificDocsVersion)) && !ignorePreviouslyIndexedDoc) {
		return isCompatibleVersion && version.includes(specificDocsVersion)
	} else {
		return isCompatibleVersion
	}
}

async function fetchYuiDocsFromNpm(projects, projectName, filterValidVersionsForRequestedDocs) {
	if (!projects.includes(projectName)) {
		return resolve()
	}

	let projectPkgMap = {
		ember: 'ember-source',
		'ember-data': 'ember-data',
	}
	let versions = await pkgVersions(projectPkgMap[projectName])
	let versionsToProcess = [...versions].filter(filterValidVersionsForRequestedDocs)

	let getProjectFileUrl

	if (projectName === 'ember') {
		getProjectFileUrl = v => `https://unpkg.com/ember-source@${v}/docs/data.json`
	} else {
		getProjectFileUrl = v => `https://unpkg.com/ember-data@${v}/dist/docs/data.json`
	}

	return await all(
		versionsToProcess.map(async v => {
			let url = getProjectFileUrl(v)

			try {
				let data = await download(url)
				let targetDir = `tmp/s3-docs/v${v}`
				let targetFile = `${targetDir}/${projectName}-docs.json`

				mkdirp.sync(targetDir)
				fs.writeFileSync(targetFile, data)

				return targetFile
			} catch (e) {
				console.error(`Failed to download ${url} ${e}`)
			}
		})
	)
}

export default async function fetchYuiDocs(
	projects,
	specificDocsVersion,
	ignorePreviouslyIndexedDoc
) {
	let filterValidVersionsForRequestedDocs = filterValidVersions(
		specificDocsVersion,
		ignorePreviouslyIndexedDoc
	)

	let emberYuidocs = await fetchYuiDocsFromNpm(
		projects,
		'ember',
		filterValidVersionsForRequestedDocs
	)
	let emberDataYuidocs = await fetchYuiDocsFromNpm(
		projects,
		'ember-data',
		filterValidVersionsForRequestedDocs
	)

	// During local generation one or the other of these calls to fetchYuiDocsFromNpm return undefined
	return [].concat(emberYuidocs || []).concat(emberDataYuidocs || [])
}
