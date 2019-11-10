import * as fs from 'fs-extra'
import * as RSVP from 'rsvp'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import { pluralize } from 'inflected'

// updateOrCreate
export default function saveDoc(document, projectName, version = '') {
	let documentPath = path.join(
		'tmp',
		'json-docs',
		projectName,
		version,
		pluralize(document.data.type),
		encodeURIComponent(`${document.data.id}.json`)
	)

	let json = JSON.stringify(document, null, 2)

	return new RSVP.Promise((resolve, reject) => {
		if (document.data.id.length > 50) {
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
