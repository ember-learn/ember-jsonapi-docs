// eslint-disable-next-line
require = require('esm')(module /*, options*/)
require('hard-rejection')()

const argv = require('minimist')(process.argv.slice(2))

let possibleProjects = ['ember', 'ember-data']
let projects =
	argv.project && possibleProjects.includes(argv.project) ? [argv.project] : possibleProjects
let specificDocsVersion = argv.version ? argv.version : ''

let ignorePreviouslyIndexedDoc =
	projects.length !== 0 && specificDocsVersion !== '' && argv.ignorePreviouslyIndexedDoc
let runClean = !!argv.clean

const { apiDocsProcessor } = require('./main.js')
apiDocsProcessor(projects, specificDocsVersion, ignorePreviouslyIndexedDoc, runClean)
