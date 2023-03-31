import saveDoc from './save-document'

export default async function (document, projectName, projectVersion) {
	let things = document.data

	for (const klass of things) {
		if (!klass.id) {
			console.log(klass)
			console.log(new Error('WHAT').stack)
			process.exit(1)
		}
		let document = {
			data: klass,
		}

		console.log(`Creating ${klass.id} in ${projectName}-${projectVersion}`)
		await saveDoc(document, projectName, projectVersion)
	}

	return document
}
