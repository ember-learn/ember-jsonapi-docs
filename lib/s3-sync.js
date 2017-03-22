const { Promise } = require('rsvp')
const S3 = require('s3')
const ora = require('ora')
const http = require('http')
const https = require('https')
const humanSize = require('human-size')
const zlib = require('zlib')
const zopfli = require('node-zopfli')
const glob = require('glob')
const fs = require('graceful-fs')
const fse = require('fs-extra')
const extendObj = require('lodash.merge')
const rimraf = require('rimraf')

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

const jsonDocsDirDownloadOptions = {
  localDir: 'tmp/json-docs',
  s3Params: {
    Bucket: 'api-docs.emberjs.com',
    Prefix: 'json-docs'
  }
}

const jsonDocsDirUploadOptions = extendObj({
  s3Params: {
    CacheControl: 'max-age=365000000, immutable',
    ContentEncoding: 'gzip'
  }
}, jsonDocsDirDownloadOptions)

const handleCompressionOp = (operation, directory) => {
  let filesToProcess = glob.sync(`${directory}/**/*.json`)

  let isCompression = operation === 'compress'

  let serverDocsDir = `${directory}-original`

  // This block is to avoid recompression again on upload
  if (!isCompression && fs.existsSync(directory)) {
    fse.copySync(directory, serverDocsDir)
  } else {
    let preCompressedFiles = glob.sync(`${serverDocsDir}/**/*.json`).map(f => f.replace(serverDocsDir, directory))
    filesToProcess = filesToProcess.filter(f => {
      let isProjectFile = f.indexOf('/projects/') !== -1
      let fileExists = preCompressedFiles.includes(f)
      if (isProjectFile || !fileExists) {
        return f
      }
    })
  }

  let opProgress = ora(`${operation}ion started`).start()

  filesToProcess.forEach(file => {
    opProgress.text = `${operation}ing: ${file}`
    let content = fs.readFileSync(file, {})
    const transformedContent = isCompression ? zopfli.gzipSync(content, {}) : zlib.gunzipSync(content)
    fs.writeFileSync(file, transformedContent)
  })

  if (isCompression) {
    filesToProcess.forEach(f => {
      fse.copySync(f, f.replace(directory, serverDocsDir))
    })
    fse.moveSync(serverDocsDir, directory, {overwrite: true})
  }

  opProgress.succeed(`${operation}ion complete`)
  return Promise.resolve()
}

const handleCompression = (directory) => handleCompressionOp('compress', directory)
const handleDecompression = (directory) => handleCompressionOp('decompress', directory)

const syncDir = (operation, options) => {
  return new Promise((resolve, reject) => {
    let isDownload = operation === 'download'

    let preSyncStep = !isDownload ? handleCompression(options.localDir) : Promise.resolve()

    preSyncStep.then(() => {
      let sync = isDownload ? client.downloadDir(options) : client.uploadDir(extendObj({ deleteRemoved: true }, options))
      let progressIndicator = ora(`${operation}ing json docs`).start()

      sync.on('progress', () => {
        const { progressAmount, progressTotal } = sync
        progressIndicator.text = `${operation}ing json docs (${humanSize(progressAmount)} of ${humanSize(progressTotal)})`
      })

      sync.on('end', () => {
        let postSyncStep = isDownload ? handleDecompression(options.localDir) : Promise.resolve()
        postSyncStep.then(() => {
          progressIndicator.succeed(`${operation}ed json docs`)
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
    if (fs.existsSync('tmp')) {
      rimraf('tmp', () => {
        fse.mkdirpSync('tmp/json-docs')
      })
    } else {
      fse.mkdirpSync('tmp/json-docs')
    }
    return syncDir('download', jsonDocsDirDownloadOptions)
  }
  return Promise.resolve()
}

module.exports.syncToS3 = function syncToS3 () {
  if (AWS_SHOULD_PUBLISH === 'yes') {
    return syncDir('upload', jsonDocsDirUploadOptions)
  }
  return Promise.resolve()
}
