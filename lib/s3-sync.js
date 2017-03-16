const { Promise } = require('rsvp')
const S3 = require('s3')
const ora = require('ora')
const http = require('http')
const https = require('https')
const humanSize = require('human-size')
const assign = require('lodash.assign')

// To increase s3's download & upload dir perf
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 30

const {
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_SHOULD_PUBLISH,
  SKIP_S3_SYNC
} = process.env

const client = S3.createClient({
  s3Options: {
    accessKeyId: AWS_ACCESS_KEY,
    secretAccessKey: AWS_SECRET_KEY
  }
})

const bucketToUse = 'sk-ed' // TODO: Siva - make core team create one

const s3DocsDirOptions = {
  localDir: 'tmp/s3-docs',
  s3Params: {
    Bucket: bucketToUse,
    Prefix: 's3-docs'
  }
}

const jsonDocsDirOptions = {
  localDir: 'tmp/json-docs',
  s3Params: {
    Bucket: bucketToUse,
    Prefix: 'json-docs'
  }
}

const syncDir = (operation, options, docName) => {
  return new Promise((resolve, reject) => {
    let isDownload = operation === 'download'

    let sync = isDownload ? client.downloadDir(options) : client.uploadDir(assign({ deleteRemoved: true }, options))
    let progressIndicator = ora(`${operation}ing ${docName} docs`).start()

    sync.on('progress', () => {
      const { progressAmount, progressTotal } = sync
      progressIndicator.text = `${operation}ing ${docName} docs (${humanSize(progressAmount)} of ${humanSize(progressTotal)})`
    })

    sync.on('end', () => {
      progressIndicator.succeed(`${operation}ed ${docName} docs`)
      resolve()
    })

    sync.on('error', (err) => {
      progressIndicator.fail()
      reject(err)
    })
  })
}

const downloadDir = (options, docName) => syncDir('download', options, docName)
const uploadDir = (options, docName) => syncDir('upload', options, docName)

module.exports.syncToLocal = function syncToLocal () {
  if (!SKIP_S3_SYNC) {
    return downloadDir(s3DocsDirOptions, 's3')
    .then(() => downloadDir(jsonDocsDirOptions, 'json'))
  }
  return Promise.resolve()
}

module.exports.syncToS3 = function syncToS3 () {
  if (AWS_SHOULD_PUBLISH === 'yes') {
    return uploadDir(s3DocsDirOptions, 's3')
    .then(() => uploadDir(jsonDocsDirOptions, 'json'))
  }
  return Promise.resolve()
}
