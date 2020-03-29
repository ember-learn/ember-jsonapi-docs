import * as commandExists from 'command-exists'
import * as execa from 'execa'

import { AppStore } from './classes/app-store'

const checkExecutableValidity = async () => {
	if (!(await commandExists('aws'))) {
		console.log(
			'\nPlease install the aws cli by following the instructions at:\nhttps://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html\n'
		)
		process.exit(127)
	}

	try {
		await execa('aws', ['sts', 'get-caller-identity'])
	} catch (e) {
		console.log(
			'\nPlease configure the aws client by following the instructions at:\nhttps://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html\n'
		)
		throw e
	}
}

interface ExecuteS3SyncOptions {
	from: string
	to: string
	options?: string[]
}

const executeS3Sync = async ({ from, to, options = [] }: ExecuteS3SyncOptions, debug = false) => {
	let args = ['s3', 'sync', from, to, ...options]

	if (to.startsWith('s3://')) {
		args = [...args, '--acl', 'public-read']
	}

	if (debug) {
		args.push('--dryrun')
		console.log(`aws ${args.join(' ')}`)
	}

	const { stdout } = await execa('aws', args)
	console.debug(stdout)
}

export async function backupExistingFolders(apiDocsBucketUrl: string) {
	await checkExecutableValidity()
	const timestamp = new Date().toLocaleString().replace(/[/|:| |,]/g, '_')

	await executeS3Sync({
		from: `${apiDocsBucketUrl}/rev-index`,
		to: `${apiDocsBucketUrl}/backup/${timestamp}/rev-index`,
	})

	await executeS3Sync({
		from: `${apiDocsBucketUrl}/json-docs`,
		to: `${apiDocsBucketUrl}/backup/${timestamp}/json-docs`,
	})
}

export async function uploadDocsToS3(apiDocsBucketUrl: string) {
	await checkExecutableValidity()
	const dataDir = AppStore.config.get('dataDir')

	console.log('\n\n\n')
	console.log('Uploading docs to s3, this should take a bit!')

	// We want sequential uploads here
	await executeS3Sync({
		from: `${dataDir}/styles.css`,
		to: `${apiDocsBucketUrl}/styles.css`,
	})

	await executeS3Sync({
		from: `${dataDir}/json-docs`,
		to: `${apiDocsBucketUrl}/json-docs`,
		options: ['--cache-control', 'max-age=365000000, immutable'],
	})

	return executeS3Sync({
		from: `${dataDir}/rev-index`,
		to: `${apiDocsBucketUrl}/rev-index`,
	})
}
