const pretty = require('pretty-time')

// eslint-disable-next-line
require = require('esm')(module /*, options*/)
require('hard-rejection')()

const argv = require('minimist')(process.argv.slice(2))

let possibleProjects = ['ember', 'ember-data']
let projects =
	argv.project && possibleProjects.includes(argv.project) ? [argv.project] : possibleProjects
let specificDocsVersion = argv.version ? argv.version : ''

const hardRejection = require('hard-rejection')

const { apiDocsProcessor } = require('./main.js')

;(async () => {
	hardRejection()
	const hrstart = process.hrtime()
	await apiDocsProcessor(projects, specificDocsVersion)
	const hrend = process.hrtime(hrstart)
	console.info(pretty(hrend))
})()
