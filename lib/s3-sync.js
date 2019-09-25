import execa from 'execa'
import commandExists from 'command-exists'

const apiDocsBucketUrl = 's3://api-docs.emberjs.com'

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

const executeS3Sync = async ({ from, to = '', options = [] }, debug = false) => {
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

export async function backupExistingFolders() {
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

export async function downloadExistingDocsToLocal() {
	const promises = [
		executeS3Sync({
			from: `${apiDocsBucketUrl}/rev-index`,
			to: 'tmp/rev-index',
		}),
		executeS3Sync({
			from: `${apiDocsBucketUrl}/s3-docs`,
			to: 'tmp/s3-docs',
		}),
	]

	/* if (process.env.AWS_SHOULD_PUBLISH === 'yes') {
		promises.push(
			executeS3Sync({
				from: `${apiDocsBucketUrl}/json-docs`,
				to: 'tmp/json-docs',
			})
		)
	} */

	// For parallel downloads
	return await Promise.all(promises)
}

export async function uploadDocsToS3() {
	// We want sequential uploads here
	if (process.env.AWS_SHOULD_PUBLISH === 'yes') {
		console.log('\n\n\n')
		console.log('Uploading docs to s3, this should take a bit!')

		await executeS3Sync({
			from: 'tmp/json-docs',
			to: `${apiDocsBucketUrl}/json-docs`,
			options: ['--cache-control', 'max-age=365000000, immutable'],
		})

		await executeS3Sync({
			from: 'tmp/rev-index',
			to: `${apiDocsBucketUrl}/rev-index`,
		})
	}
}
