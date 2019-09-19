import chalk from 'chalk'
import commandExists from 'command-exists'
import execa from 'execa'
import { copyFileSync, existsSync, mkdirpSync, removeSync } from 'fs-extra'
import minimist from 'minimist'
import path from 'path'
import 'hard-rejection/register'

import { exit } from './utils'

const argv = minimist(process.argv.slice(2))

const { project, version } = argv


const runCmd = async (cmd, path) => {
	console.log(chalk.underline(`Running '${chalk.green(cmd)}'`))
	const executedCmd = await execa(cmd, { cwd: path, shell: true })

	if (executedCmd.failed) {
		console.error(executedCmd.stderr)
		process.exit(1)
	}

	console.log(executedCmd.stdout + '\n')
}
;(async () => {
	if (!project || !version) {
		exit(
			chalk.red('Both project and version args are required.\n'),
			chalk.yellow(' e.g., yarn gen --project ember --version 3.10.1')
		)
	}

	if (!['ember', 'ember-data'].includes(project)) {
		exit(chalk.red(`Project has to be either 'ember' or 'ember-data'. (was given ${project})\n`))
	}

	try {
		await commandExists('yarn')
	} catch (e) {
		exit(chalk.red('We need yarn installed globally for this script to work'))
	}

	let emberProjectPath = path.join(__dirname, '../', 'ember.js')
	let emberDataProjectPath = path.join(__dirname, '../', 'data')

	let checkIfProjectDirExists = dirPath => {
		if (!existsSync(dirPath)) {
			exit(chalk.yellow(`Please checkout the ${project} project at ${dirPath}`))
		}
	}

	let buildDocs = async projDirPath => {
		checkIfProjectDirExists(projDirPath)
		await runCmd('yarn', projDirPath)

		console.log('\n\n')

		await runCmd(project === 'ember' ? 'yarn docs' : 'yarn build:production', projDirPath)

		const projYuiDocFile = `tmp/s3-docs/v${version}/${project}-docs.json`
		removeSync(projYuiDocFile)
		removeSync(`tmp/json-docs/${project}/${version}`)

		mkdirpSync(`tmp/s3-docs/v${version}`)

		const yuiDocFile = path.join(
			projDirPath,
			project === 'ember' ? 'docs/data.json' : 'packages/-ember-data/dist/docs/data.json'
		)
		copyFileSync(yuiDocFile, projYuiDocFile)
	}

	let dirMap = {
		ember: emberProjectPath,
		'ember-data': emberDataProjectPath,
	}

	await buildDocs(dirMap[project])

	await execa('yarn', [
		'start',
		'--project',
		project,
		'--version',
		version,
		'--ignorePreviouslyIndexedDoc',
	]).stdout.pipe(process.stdout)
})()
