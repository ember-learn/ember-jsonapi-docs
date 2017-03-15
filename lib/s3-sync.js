const { Promise } = require('rsvp')
const S3 = require('s3')
const ora = require('ora')
const http = require('http')
const https = require('https')
const humanSize = require('human-size')

// To increase s3's download & upload dir perf
http.globalAgent.maxSockets = https.globalAgent.maxSockets = 30

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_SHOULD_PUBLISH
} = process.env

const client = S3.createClient({
  s3Options: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
})

const bucketToUse = 'sk-ed' // TODO: Siva - make core team create one

const s3DocsDirOptions = {
  localDir: 'tmp/s3-docs',
  deleteRemoved: true,
  s3Params: {
    Bucket: bucketToUse,
    Prefix: 's3-docs'
  }
}

const jsonDocsDirOptions = {
  localDir: 'tmp/json-docs',
  deleteRemoved: true,
  s3Params: {
    Bucket: bucketToUse,
    Prefix: 'json-docs'
  }
}

module.exports.syncToLocal = function syncToLocal () {
  return new Promise((resolve, reject) => {
    let progressIndicator = ora(`Downloading s3 docs`).start()
    let downloader = client.downloadDir(s3DocsDirOptions)

    downloader.on('progress', () => {
      const { progressAmount, progressTotal } = downloader
      progressIndicator.text = `Downloading s3 docs (${humanSize(progressAmount)} of ${humanSize(progressTotal)})`
    })

    downloader.on('end', () => {
      progressIndicator.succeed(`Downloaded s3 docs`)
      resolve()
    })

    downloader.on('error', () => {
      progressIndicator.fail()
      reject()
    })
  }).then(() => {
    return new Promise((resolve, reject) => {
      let progressIndicator = ora(`Downloading json docs`).start()
      let downloader = client.downloadDir(jsonDocsDirOptions)

      downloader.on('progress', () => {
        const { progressAmount, progressTotal } = downloader
        progressIndicator.text = `Downloading json docs (${humanSize(progressAmount)} of ${humanSize(progressTotal)})`
      })

      downloader.on('end', () => {
        progressIndicator.succeed(`Downloaded json docs`)
        resolve()
      })

      downloader.on('error', () => {
        progressIndicator.fail()
        reject()
      })
    })
  })
}
