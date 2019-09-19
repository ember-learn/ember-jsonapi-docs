import chalk from 'chalk'
import commandExists from 'command-exists'
import execa from 'execa'
import { exit } from './utils'
import path from 'path'
import { existsSync } from 'fs-extra'

// TODO consider making this dynamically configurable
// so you could easily point to a fork, etc
const projectUrls = new Map([
	['ember.js', 'git@github.com:emberjs/ember.js.git'],
	['data', 'git@github.com:emberjs/data.git'],
	['ember-api-docs', 'git@github.com:ember-learn/ember-api-docs.git']
])

const bailIfNotInstalled = async command => {
	try {
		await commandExists(command)
	} catch (e) {
		exit(chalk.red(`${command} needs to be installed for this script to work.`))
	}
}

const cloneIfNotThere = async projectName => {
	const aPath = path.resolve('../', projectName)
	if (existsSync(path.resolve(aPath, '.git'))) {
		console.log(chalk.black(`${projectName} is already cloned to ${aPath}`))
		return
	}
	const flattenArgs = args => {
		return args.map(val => {
			return Array.isArray(val) ? val.join(' '): val
		}).join(' ')
	}
	const args = ['git', ['clone', projectUrls.get(projectName)]]
	const cwd =  path.resolve('../')
	console.log(chalk.underline(`Running '${chalk.green(flattenArgs(args))}' in ${cwd}`))
	// FIXME why does this not pipe git's standard out when you run `yarn setup`?
	// because I would like to simply pipe git logs instead of our custom log
	await execa(...args, {
		cwd
	}).stdout.pipe(process.stdout)
}

;(async () => {
	await bailIfNotInstalled('yarn')
	await bailIfNotInstalled('git')

	for (const project of projectUrls.keys()) {
		cloneIfNotThere(project)
	}
})()
