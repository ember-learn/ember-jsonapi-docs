import S3 from 's3'
import RSVP from 'rsvp'
import path from 'path'
import fs from 'fs-extra'
import semverUtils from 'semver-utils'
import semverExtra from 'semver-extra'
import mkdirp from 'mkdir-promise'
import { find as findObject, groupBy, trim, isEmpty } from 'lodash'

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
			.on('data', ({ Contents }) => {
				data = data.concat(Contents)
			})
			.on('end', () => resolve(data))
			.on('error', reject)
	})
}

const getSrcFilePath = Key => {
	let name = path.basename(Key)
	let dir = path.basename(path.dirname(Key))
	return path.join('tmp', 's3-docs', dir, name)
}

function downloadFile({ Key }) {
	let finalFile = getSrcFilePath(Key)

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
							Key,
						},
					})
					.on('end', () => {
						console.log(`Downloaded ${finalFile}`)
						resolve(finalFile)
					})
					.on('error', err => {
						console.warn(`err! ${err}`)
						reject(err)
					})
			}
		})
	})
}

function filterReleaseDocs({ Key }) {
	let key = Key.split('/')
	let tag = key[key.length - 2]
	let versionRegex = /v\d+\.\d+\.\d+$/
	return versionRegex.test(tag) && /-docs\.json/.test(key)
}

export default function fetchYuiDocs(projects, specificDocsVersion, ignorePreviouslyIndexedDoc) {
	return getObjects().then(docs => {
		let projectFiles = projects.map(p => `${p}-docs.json`)

		let filteredDocs = docs
			.filter(filterReleaseDocs)
			.filter(
				({ Key }) =>
					projectFiles.includes(Key.split('/').pop()) && Key.includes(specificDocsVersion)
			)

		if (!isEmpty(trim(specificDocsVersion))) {
			if (ignorePreviouslyIndexedDoc) {
				return RSVP.map(filteredDocs, ({ Key }) => {
					console.log(
						`Skipping download of ${Key} so that you can use your local file. We hope you know what you're doing 😅`
					)
					return getSrcFilePath(Key)
				})
			} else {
				return RSVP.map(filteredDocs, downloadFile)
			}
		}

		let projectDocs = groupBy(filteredDocs, ({ Key }) => Key.split('/')[2].replace('.json', ''))

		let docsToProcess = []
		Object.keys(projectDocs).forEach(projectName => {
			let docs = projectDocs[projectName].map(d => {
				return Object.assign({}, d, semverUtils.parse(d.Key.split('/')[1]))
			})
			let xDocs = groupBy(docs, ({ major, minor }) => `${major}.${minor}`)

			docsToProcess = Object.keys(xDocs).map(key => {
				const latestVer = semverExtra.max(xDocs[key].map(({ version }) => version))
				return findObject(docs, ({ version }) => version === latestVer)
			})
		})

		console.log(
			`Need to process ${docsToProcess.length} out of ${filteredDocs.length} published yui docs`
		)

		return RSVP.map(docsToProcess, downloadFile)
	})
}
