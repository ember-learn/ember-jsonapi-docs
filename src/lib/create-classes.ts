import RSVP from 'rsvp'
import saveDoc from './save-document'

export default (document, projectName, projectVersion) => {
	let things = document.data

	return RSVP.map(things, klass => {
		if (!klass.id) {
			console.log(klass)
			console.log(new Error('WHAT').stack)
			process.exit(1)
		}
		let document = {
			data: klass,
		}

		console.log(`Creating ${klass.id} in ${projectName}-${projectVersion}`)
		return saveDoc(document, projectName, projectVersion)
	}).then(() => document)
}
