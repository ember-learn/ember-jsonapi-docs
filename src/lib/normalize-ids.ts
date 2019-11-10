import _ from 'lodash'
import RSVP from 'rsvp'
import saveDoc from './save-document'
import tojsonapi from 'yuidoc-to-jsonapi/lib/converter'
import updateIDs from './update-with-versions-and-project'
import { byType as findType } from './filter-jsonapi-doc'

function removeLongDocsBecauseEmber1HasWeirdDocs({ id }) {
	let str = 'A Suite can'
	return !id.includes(str)
}

function extractRelationship({ id, type }) {
	return { id, type }
}

function filterForVersion(version) {
	return ({ relationships }) => {
		const projectVersion = relationships['project-version'].data.id.split('-').pop()
		return version.version === projectVersion
	}
}

function isPrivate({ attributes }) {
	return attributes.access === 'private' || attributes.deprecated === true
}

function isPublic({ attributes }) {
	return attributes.access !== 'private' && attributes.deprecated !== true
}

/**
 * starting with ember 2.16, we want to only show rfc 176 modules. "ember" still acts
 * as a "catch all" module, but showing this in the docs will confuse people.
 * Therefore we filter it out of the module list here.
 */
function filter176(project, version, { attributes }) {
	return project !== 'ember' || parseInt(version.split('.')[1]) < 16 || attributes.name !== 'ember'
}

function normalizeIDs(pVersions, projectName) {
	let jsonapidocs = pVersions.map(({ data, version }) => {
		Object.keys(data.modules).forEach(k => {
			let modWithVer = data.modules[k]
			modWithVer.version = version
			data.modules[k] = modWithVer
		})
		let doc = tojsonapi(data)
		return updateIDs(doc, projectName, version)
	})

	let jsonapidoc = {
		data: _.flatten(jsonapidocs.map(({ data }) => data)),
	}

	jsonapidoc.data = jsonapidoc.data.filter(removeLongDocsBecauseEmber1HasWeirdDocs)

	let projectVersions = pVersions.map(version => {
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

	let versionDocs = RSVP.map(projectVersions, projectVersion => {
		let doc = { data: projectVersion }

		let version = projectVersion.attributes.version

		return saveDoc(doc, projectName, version)
	})

	let doc = { data: jsonapidoc.data.concat(projectVersions) }
	return versionDocs.then(() => doc)
}

export default normalizeIDs
