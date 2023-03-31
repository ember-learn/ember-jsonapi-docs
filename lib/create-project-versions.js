import tojsonapi from 'yuidoc-to-jsonapi/lib/converter'
import saveDoc from './save-document'
import updateIDs from './update-with-versions-and-project'

export default async function createProjectVersions(versions, projectName) {
	const results = []
	for (const version of versions) {
		let jsonapidoc = updateIDs(tojsonapi(version.data), version.version)

		let projectData = {
			type: 'project',
			id: projectName,
			attributes: {
				name: projectName,
				github: 'https://github.com/emberjs/ember.js',
			},
		}

		let versionDocument = {
			data: {
				id: `${projectName}-${version.version}`,
				type: 'project-version',
				attributes: {
					version: version.version,
				},
				relationships: {
					classes: {
						data: jsonapidoc.data
							.filter(item => item.type === 'class' && item.static !== 1)
							.map(({ id }) => ({ id, type: 'class' })),
					},
					modules: {
						data: jsonapidoc.data
							.filter(({ type }) => type === 'module')
							.map(({ id }) => ({ id, type: 'module' })),
					},
					namespaces: {
						data: jsonapidoc.data
							.filter(item => item.type === 'class' && item.static === 1)
							.map(({ id }) => ({ id, type: 'namespace' })),
					},
					project: {
						data: {
							id: projectName,
							type: 'project',
						},
					},
				},
			},
			included: [projectData],
		}

		const result = await saveDoc(versionDocument, projectName, version.version)
		results.push(result)
	}
	return results
}
