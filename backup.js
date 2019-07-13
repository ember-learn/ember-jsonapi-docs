import { backupExistingFolders } from './lib/s3-sync'

;(async () => {
	await backupExistingFolders()
	console.log('\n\n')
	console.log('Done!')
})()
