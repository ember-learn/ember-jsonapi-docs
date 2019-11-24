import * as SafePromise from 'bluebird'

import saveDoc from './save-document'
import toJsonAPI from './to-json-api'
import updateIDs from './update-with-versions-and-project'

export default function createProjectVersions(versions: any[], projectName: string) {
	return SafePromise.map(versions, version => {
		let jsonapidoc = updateIDs(toJsonAPI(version.data), version.version)

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
							.filter((item: any) => item.type === 'class' && item.static !== 1)
							.map(({ id }: any) => ({ id, type: 'class' })),
					},
					modules: {
						data: jsonapidoc.data
							.filter(({ type }: any) => type === 'module')
							.map(({ id }: any) => ({ id, type: 'module' })),
					},
					namespaces: {
						data: jsonapidoc.data
							.filter((item: any) => item.type === 'class' && item.static === 1)
							.map(({ id }: any) => ({ id, type: 'namespace' })),
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

		return saveDoc(versionDocument, projectName, version.version)
	})
}
