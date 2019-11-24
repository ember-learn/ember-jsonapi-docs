import { Command, flags } from '@oclif/command'
import 'hard-rejection/register'

import { backupExistingFolders } from '../lib/s3-sync'

export default class Backup extends Command {
	static description = 'Backup our json docs on the official s3 store'

	static flags = {
		help: flags.help({ char: 'h' }),
	}

	async run() {
		await backupExistingFolders()
	}
}
