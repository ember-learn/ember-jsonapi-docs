// CLI utilities used by generate-local.js and setup-repositories.js
export const exit = function exit() {
	console.log(...arguments)
	process.exit(1)
}

