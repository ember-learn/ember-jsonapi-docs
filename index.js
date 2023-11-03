// eslint-disable-next-line
require = require('esm')(module /*, options*/)

const argv = require('minimist')(process.argv.slice(2))

let possibleProjects = ['ember', 'ember-data']
let projects =
	argv.project && possibleProjects.includes(argv.project) ? [argv.project] : possibleProjects
let specificDocsVersion = argv.version ? argv.version : ''

let runClean = !!argv.clean
let noSync = !argv.sync

const { apiDocsProcessor } = require('./main.js')
apiDocsProcessor(projects, specificDocsVersion, runClean, noSync)
