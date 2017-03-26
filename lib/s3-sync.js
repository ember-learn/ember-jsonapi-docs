const { Promise } = require('rsvp')
const S3 = require('s3')
const ora = require('ora')
const http = require('http')
const https = require('https')
const humanSize = require('human-size')
const extendObj = require('lodash.merge')

// To increase s3's download & upload dir perf
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 30

const {AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_SHOULD_PUBLISH, SKIP_S3_SYNC} = process.env

const client = S3.createClient({
  s3Options: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
})

const jsonDocsDirDownloadOptions = {
  localDir: 'tmp/json-docs',
  s3Params: {
    Bucket: 'sk-ed',
    Prefix: 'json-docs-1'
  }
}

const jsonDocsDirUploadOptions = extendObj({
  s3Params: {
    CacheControl: 'max-age=365000000, immutable',
    GrantRead: 'uri=http://acs.amazonaws.com/groups/global/AllUsers'
  }
}, jsonDocsDirDownloadOptions)

const revDocsDirUploadOptions = {
  localDir: 'tmp/rev-index',
  s3Params: {
    Bucket: 'sk-ed',
    Prefix: 'rev-index',
    GrantRead: 'uri=http://acs.amazonaws.com/groups/global/AllUsers'
  }
}

const handleCompression = (directory) => Promise.resolve()
const handleDecompression = (directory) => Promise.resolve()

const syncDir = (operation, options) => {
  return new Promise((resolve, reject) => {
    let isDownload = operation === 'download'

    let preSyncStep = !isDownload ? handleCompression(options.localDir) : Promise.resolve()

    preSyncStep.then(() => {
      let sync = isDownload ? client.downloadDir(options) : client.uploadDir(options)
      let progressIndicator = ora(`${operation}ing ${options.s3Params.Prefix} docs`).start()

      sync.on('progress', () => {
        const { progressAmount, progressTotal } = sync
        progressIndicator.text = `${operation}ing json docs (${humanSize(progressAmount)} of ${humanSize(progressTotal)})`
      })

      sync.on('end', () => {
        let postSyncStep = isDownload ? handleDecompression(options.localDir) : Promise.resolve()
        postSyncStep.then(() => {
          progressIndicator.succeed(`${operation}ed ${options.s3Params.Prefix} docs`)
          resolve()
        })
      })

      sync.on('error', (err) => {
        progressIndicator.fail()
        reject(err)
      })
    })
  })
}

module.exports.syncToLocal = function syncToLocal () {
  if (!SKIP_S3_SYNC) {
    return syncDir('download', jsonDocsDirDownloadOptions)
  }
  return Promise.resolve()
}

module.exports.syncToS3 = function syncToS3 () {
  if (AWS_SHOULD_PUBLISH === 'yes') {
    return syncDir('upload', jsonDocsDirUploadOptions).then(() => {
      syncDir('upload', revDocsDirUploadOptions)
    })
  }
  return Promise.resolve()
}
