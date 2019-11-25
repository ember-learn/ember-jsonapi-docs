import { Command, flags } from '@oclif/command'
import 'hard-rejection/register'

import { backupExistingFolders } from '../lib/s3-sync'

export default class Backup extends Command {
	static description = 'Backup our json docs on the s3 store'

	static flags = {
		help: flags.help({ char: 'h' }),

		s3Url: flags.string({
			description: 's3 url to publish the contents to',
			default: 's3://api-docs.emberjs.com/next-gen',
		}),
	}

	async run() {
		const { flags } = this.parse(Backup)

		await backupExistingFolders(flags.s3Url)
	}
}
