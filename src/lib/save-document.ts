import * as SafePromise from 'bluebird'
import * as fs from 'fs-extra'
import { pluralize } from 'inflected'
import * as path from 'path'
import { AppStore } from './classes/app-store'

// updateOrCreate
export default function saveDoc(document: any, projectName: string, version = '') {
	const dataDir = AppStore.config.get('dataDir') as string

	let documentPath = path.join(
		dataDir,
		'json-docs',
		projectName,
		version,
		pluralize(document.data.type),
		encodeURIComponent(`${document.data.id}.json`)
	)

	let json = JSON.stringify(document, null, 2)

	return new SafePromise((resolve, reject) => {
		if (document.data.id.length > 50) {
			// wtf ember 1.0 docs??
			return resolve()
		}

		fs.mkdirpSync(path.dirname(documentPath))
		// console.log(`Saving ${documentPath}`) // good for debuggin

		return fs.writeFile(documentPath, json, err => {
			if (err) {
				return reject(err)
			}
			resolve(documentPath)
		})
	})
}
