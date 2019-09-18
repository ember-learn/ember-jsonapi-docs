import { backupExistingFolders } from './lib/s3-sync'
import 'hard-rejection/register'
;(async () => {
	await backupExistingFolders()
	console.log('\n\n')
	console.log('Done!')
})()
