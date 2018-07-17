const { Promise, all: waitForAllPromises } = require('rsvp')
const S3 = require('s3')
const ora = require('ora')
const http = require('http')
const https = require('https')
const humanSize = require('human-size')

// To increase s3's download & upload dir perf
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 30

const { AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_SHOULD_PUBLISH, SKIP_S3_SYNC } = process.env

const client = S3.createClient({
	s3Options: {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_SECRET_KEY,
	},
})

const jsonDocsDirDownloadOptions = {
	localDir: 'tmp/json-docs',
	s3Params: {
		Bucket: 'api-docs.emberjs.com',
		Prefix: 'json-docs',
	},
}

const jsonDocsDirUploadOptions = {
	localDir: 'tmp/json-docs',
	s3Params: {
		//ACL: 'public-read',
		Bucket: 'api-docs.emberjs.com',
		CacheControl: 'max-age=365000000, immutable',
		GrantRead: 'uri=http://acs.amazonaws.com/groups/global/AllUsers',
		//maxRetries: 5,
		Prefix: 'json-docs',
	},
}

const revDocsDirUploadOptions = {
	localDir: 'tmp/rev-index',
	s3Params: {
		//ACL: 'public-read',
		Bucket: 'api-docs.emberjs.com',
		GrantRead: 'uri=http://acs.amazonaws.com/groups/global/AllUsers',
		//maxRetries: 5,
		Prefix: 'rev-index',
	},
}

const syncDir = (operation, options) => {
	return new Promise((resolve, reject) => {
		let isDownload = operation === 'download'

		let sync = isDownload ? client.downloadDir(options) : client.uploadDir(options)
		let progressIndicator = ora(`${operation}ing ${options.s3Params.Prefix} docs`).start()

		sync.on('progress', () => {
			const { progressAmount, progressTotal } = sync
			progressIndicator.text = `${operation}ing json docs (${humanSize(
				progressAmount
			)} of ${humanSize(progressTotal)})`
		})

		sync.on('end', () => {
			progressIndicator.succeed(`${operation}ed ${options.s3Params.Prefix} docs`)
			resolve()
		})

		sync.on('error', err => {
			progressIndicator.fail()
			reject(err)
		})
	})
}

module.exports.downloadExistingDocsToLocal = function downloadExistingDocsToLocal() {
	if (!SKIP_S3_SYNC) {
		let revDocsDirDownloadOptions = revDocsDirUploadOptions
		delete revDocsDirDownloadOptions.s3Params.GrantRead

		return waitForAllPromises([
			syncDir('download', jsonDocsDirDownloadOptions),
			syncDir('download', revDocsDirDownloadOptions),
		])
	}
	console.log('Skipping download of pre-cached docs')
	return Promise.resolve()
}

module.exports.uploadToS3 = function uploadToS3() {
	if (AWS_SHOULD_PUBLISH === 'yes') {
		return syncDir('upload', jsonDocsDirUploadOptions).then(() =>
			syncDir('upload', revDocsDirUploadOptions)
		)
	}
	return Promise.resolve()
}
