import RSVP from 'rsvp'
import { filler1 } from './lib/filler1'
import { filler2 } from './lib/filler2'
import readDocs from './lib/read-docs'
import { revProjectDocs } from './lib/rev-project-docs'
import { uploadDocsToS3 } from './lib/s3-sync'

const supportedProjects = ['ember', 'ember-data']

export async function apiDocsProcessor(projects, specificDocsVersion) {
	let docsVersionMsg = specificDocsVersion !== '' ? `. For version ${specificDocsVersion}` : ''
	console.log(`Downloading docs for ${projects.join(' & ')}${docsVersionMsg}`)

	let docs = await readDocs(projects, specificDocsVersion)

	await RSVP.map(projects, projectName =>
		RSVP.map(docs[projectName], doc => filler2(projectName, doc)).then(docs =>
			filler1(projectName, docs)
		)
	)

	await revProjectDocs(supportedProjects)

	return await uploadDocsToS3()
}
