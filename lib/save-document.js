import fs from 'fs-extra'
import path from 'path'
import mkdirp from 'mkdirp'
import { pluralize } from 'inflected'
import chalk from 'chalk'

const docsPath = '../ember-api-docs-data'

// updateOrCreate
export default async function saveDoc(document, projectName, version = '') {
	let documentPath = path.join(
		docsPath,
		'json-docs',
		projectName,
		version,
		pluralize(document.data.type),
		encodeURIComponent(`${document.data.id}.json`)
	)

	let json = JSON.stringify(document, null, 2)

	return new Promise((resolve, reject) => {
		if ((version.startsWith('1.') || version.startsWith('0.')) && document.data.id.length > 50) {
			console.log(chalk.red(`\n\n⚠️ Skipping writing document with id ${chalk.yellow(document.data.id)} because it's too long\n\n`))
			// wtf ember 1.0 docs??
			return resolve()
		}

		mkdirp.sync(path.dirname(documentPath))
		// console.log(`Saving ${documentPath}`) // good for debuggin

		return fs.writeFile(documentPath, json, err => {
			if (err) {
				return reject(err)
			}
			resolve(documentPath)
		})
	})
}
