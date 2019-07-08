import { backupExistingFolders } from './lib/s3'

async () => {
	await backupExistingFolders()
	console.log('\n\n')
	console.log('Done!')
}
