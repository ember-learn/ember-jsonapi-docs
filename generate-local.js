import chalk from 'chalk'
import commandExists from 'command-exists'
import execa from 'execa'
import { copyFileSync, ensureFileSync, existsSync, removeSync } from 'fs-extra'
import minimist from 'minimist'
import path from 'path'
import 'hard-rejection/register'

const docsPath = '../ember-api-docs-data'

const argv = minimist(process.argv.slice(2))

const { project, version, install } = argv

const exit = function exit() {
	console.log(...arguments)
	process.exit(1)
}

async function  runCmd (cmd, path, args = []) {
	console.log(chalk.underline(`Running '${chalk.green(cmd)}' in ${path}`))
	const executedCmd = await execa(cmd, args, { cwd: path, shell: true, stdio: 'inherit' })

	if (executedCmd.failed) {
		console.error(executedCmd.stdout)
		console.error(executedCmd.stderr)
		process.exit(1)
	}

	console.log(executedCmd.stdout + '\n')
}

(async () => {
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

		if (project === 'ember') {
			await runCmd('volta', projDirPath, ['run', 'yarn'])
		} else {
			await runCmd('corepack', projDirPath, ['pnpm', 'install'])
		}


		if (install) {
			await runCmd(project === 'ember' ? 'yarn' : 'pnpm install', projDirPath)
			console.log('\n\n')
		}

		await runCmd(project === 'ember' ? 'volta run yarn docs' : 'corepack pnpm run build:docs', projDirPath)

		let destination = `${docsPath}/s3-docs/v${version}/${project}-docs.json`
		ensureFileSync(destination)
		const projYuiDocFile = destination
		removeSync(projYuiDocFile)
		removeSync(`${docsPath}/json-docs/${project}/${version}`)

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

	await execa('volta', [
		'run',
		'yarn',
		'start',
		'--project',
		project,
		'--version',
		version,
		'--no-sync'
	]).stdout.pipe(process.stdout)
})()
