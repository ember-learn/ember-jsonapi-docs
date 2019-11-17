import { Command, flags } from '@oclif/command'
import * as compression from 'compression'
import * as http from 'http'
import * as handler from 'serve-handler'
import { promisify } from 'util'

const compressionHandler = promisify(compression())

export default class Serve extends Command {
	static description = 'Serve locally processed API docs'

	static flags = {
		help: flags.help({ char: 'h' }),

		port: flags.integer({
			char: 'p',
			description: 'the port to start the server on',
			default: 5050,
		}),
	}

	async run() {
		const {
			flags: { port },
		} = this.parse(Serve)

		const server = http.createServer(async (request, response) => {
			// You pass two more arguments for config and middleware
			// More details here: https://github.com/zeit/serve-handler#options
			await compressionHandler(request, response)

			return handler(request, response, { public: this.config.dataDir })
		})

		server.listen(port, () => this.log(`Running at http://localhost:${port}`))
	}
}
