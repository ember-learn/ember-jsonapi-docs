import * as SafePromise from 'bluebird'
import * as _ from 'lodash'

import { byType as findType } from './filter-jsonapi-doc'
import saveDoc from './save-document'
import toJsonAPI from './to-json-api'
import updateIDs from './update-with-versions-and-project'

function removeLongDocsBecauseEmber1HasWeirdDocs({ id }: any) {
	let str = 'A Suite can'
	return !id.includes(str)
}

function extractRelationship({ id, type }) {
	return { id, type }
}

function filterForVersion(version: any) {
	return ({ relationships }: any) => {
		const projectVersion = relationships['project-version'].data.id.split('-').pop()
		return version.version === projectVersion
	}
}

function isPrivate({ attributes }: any) {
	return attributes.access === 'private' || attributes.deprecated === true
}

function isPublic({ attributes }: any) {
	return attributes.access !== 'private' && attributes.deprecated !== true
}

/**
 * starting with ember 2.16, we want to only show rfc 176 modules. "ember" still acts
 * as a "catch all" module, but showing this in the docs will confuse people.
 * Therefore we filter it out of the module list here.
 */
function filter176(project: string, version: string, { attributes }: any) {
	return (
		project !== 'ember' || parseInt(version.split('.')[1], 10) < 16 || attributes.name !== 'ember'
	)
}

function normalizeIDs(pVersions: any, projectName: string) {
	let jsonapidocs = pVersions.map(({ data, version }: any) => {
		Object.keys(data.modules).forEach(k => {
			let modWithVer = data.modules[k]
			modWithVer.version = version
			data.modules[k] = modWithVer
		})
		let doc = toJsonAPI(data)
		return updateIDs(doc, projectName, version)
	})

	let jsonapidoc = {
		data: _.flatten(jsonapidocs.map(({ data }: any) => data)),
	}

	jsonapidoc.data = jsonapidoc.data.filter((doc: any) =>
		removeLongDocsBecauseEmber1HasWeirdDocs(doc)
	)

	let projectVersions = pVersions.map((version: any) => {
		let classes = findType(jsonapidoc, 'class')
			.filter(filterForVersion(version))
			.filter(removeLongDocsBecauseEmber1HasWeirdDocs)

		let namespaces = classes.filter(({ attributes }) => attributes.static === 1)
		classes = classes.filter(
			({ attributes }) => attributes.static !== 1 && _.has(attributes, 'file')
		)

		namespaces.forEach(ns => (ns.type = 'namespace'))

		let modules = findType(jsonapidoc, 'module')
			.filter(filterForVersion(version))
			.filter(_.curry(filter176)(projectName, version.version))

		return {
			id: `${projectName}-${version.version}`,
			type: 'project-version',
			attributes: {
				version: version.version,
			},
			relationships: {
				classes: {
					data: classes.map(extractRelationship),
				},
				namespaces: {
					data: namespaces.map(extractRelationship),
				},
				modules: {
					data: modules.map(extractRelationship),
				},
				project: {
					data: {
						id: projectName,
						type: 'project',
					},
				},
				'private-classes': {
					data: classes.filter(isPrivate).map(extractRelationship),
				},
				'public-classes': {
					data: classes.filter(isPublic).map(extractRelationship),
				},
				'private-namespaces': {
					data: namespaces.filter(isPrivate).map(extractRelationship),
				},
				'public-namespaces': {
					data: namespaces.filter(isPublic).map(extractRelationship),
				},
				'private-modules': {
					data: modules.filter(isPrivate).map(extractRelationship),
				},
				'public-modules': {
					data: modules.filter(isPublic).map(extractRelationship),
				},
			},
		}
	})

	let versionDocs = SafePromise.map(projectVersions, (projectVersion: any) =>
		saveDoc({ data: projectVersion }, projectName, projectVersion.attributes.version)
	)

	let doc = { data: jsonapidoc.data.concat(projectVersions) }
	return versionDocs.then(() => doc)
}

export default normalizeIDs
