const S3 = require('s3')
const RSVP = require('rsvp')
const path = require('path')
const fs = require('fs-extra')
const semverUtils = require('semver-utils')
const semverExtra = require('semver-extra')
const mkdirp = require('mkdir-promise')
const { find: findObject, groupBy, trim, isEmpty } = require('lodash')

// These are read-only credentials to the builds.emberjs.com bucket only.
const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = process.env

const client = S3.createClient({
	s3Options: {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_SECRET_KEY,
	},
})

const options = {
	s3Params: {
		Bucket: 'builds.emberjs.com',
		Prefix: 'tags',
	},
}

function getObjects() {
	return new RSVP.Promise((resolve, reject) => {
		let data = []

		client
			.listObjects(options)
			.on('data', d => {
				data = data.concat(d.Contents)
			})
			.on('end', () => resolve(data))
			.on('error', reject)
	})
}

function downloadFile(document) {
	let name = path.basename(document.Key)
	let dir = path.basename(path.dirname(document.Key))

	let finalFile = path.join('tmp', 's3-docs', dir, name)

	return mkdirp(path.dirname(finalFile)).then(() => {
		return new RSVP.Promise((resolve, reject) => {
			if (fs.existsSync(finalFile)) {
				return resolve(finalFile)
			} else {
				client
					.downloadFile({
						localFile: finalFile,
						s3Params: {
							Bucket: 'builds.emberjs.com',
							Key: document.Key,
						},
					})
					.on('end', () => {
						console.log(`Downloaded ${finalFile}`)
						resolve(finalFile)
					})
					.on('error', err => {
						console.warn('err! ' + err)
						reject(err)
					})
			}
		})
	})
}

function filterReleaseDocs(document) {
	let key = document.Key.split('/')
	let tag = key[key.length - 2]
	let versionRegex = /v\d+\.\d+\.\d+$/
	return versionRegex.test(tag) && /-docs\.json/.test(key)
}

module.exports = function fetchYuiDocs(projects, specificDocsVersion) {
	return getObjects().then(docs => {
		let projectFiles = projects.map(p => `${p}-docs.json`)

		let filteredDocs = docs.filter(filterReleaseDocs).filter(doc => {
			return (
				projectFiles.includes(doc.Key.split('/').pop()) &&
				doc.Key.indexOf(specificDocsVersion) !== -1
			)
		})

		if (!isEmpty(trim(specificDocsVersion))) {
			return RSVP.map(filteredDocs, downloadFile)
		}

		let projectDocs = groupBy(filteredDocs, d => d.Key.split('/')[2].replace('.json', ''))

		let docsToProcess = []

		Object.keys(projectDocs).forEach(projectName => {
			let docs = projectDocs[projectName].map(d => {
				return Object.assign({}, d, semverUtils.parse(d.Key.split('/')[1]))
			})
			let xDocs = groupBy(docs, d => `${d.major}.${d.minor}`)
			Object.keys(xDocs).forEach(key => {
				const latestVer = semverExtra.max(xDocs[key].map(d => d.version))
				docsToProcess.push(findObject(docs, d => d.version === latestVer))
			})
		})

		console.log(
			`Need to process ${docsToProcess.length} out of ${filteredDocs.length} published yui docs`
		)

		return RSVP.map(docsToProcess, downloadFile)
	})
}
