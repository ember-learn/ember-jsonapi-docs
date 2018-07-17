'use strict'

let _ = require('lodash')
let RSVP = require('rsvp')
let saveDoc = require('./save-document')
let tojsonapi = require('yuidoc-to-jsonapi/lib/converter')
let updateIDs = require('./update-with-versions-and-project')
let findType = require('./filter-jsonapi-doc').byType

function removeLongDocsBecauseEmber1HasWeirdDocs(document) {
	let str = 'A Suite can'
	return document.id.indexOf(str) === -1
}

function extractRelationship(doc) {
	return {
		id: doc.id,
		type: doc.type
	}
}

function filterForVersion(version) {
	return function(doc) {
		var projectVersion = doc.relationships['project-version'].data.id.split('-').pop()
		return version.version === projectVersion
	}
}

function isPrivate(doc) {
	return doc.attributes.access === 'private' || doc.attributes.deprecated === true
}

function isPublic(doc) {
	return doc.attributes.access !== 'private' && doc.attributes.deprecated !== true
}

/**
 * starting with ember 2.16, we want to only show rfc 176 modules. "ember" still acts
 * as a "catch all" module, but showing this in the docs will confuse people.
 * Therefore we filter it out of the module list here.
 */
function filter176(project, version, doc) {
	return (
		project !== 'ember' || parseInt(version.split('.')[1]) < 16 || doc.attributes.name !== 'ember'
	)
}

function normalizeIDs(pVersions, projectName) {
	let jsonapidocs = pVersions.map(pV => {
		Object.keys(pV.data.modules).forEach(k => {
			let modWithVer = pV.data.modules[k]
			modWithVer.version = pV.version
			pV.data.modules[k] = modWithVer
		})
		let doc = tojsonapi(pV.data)
		return updateIDs(doc, projectName, pV.version)
	})

	let jsonapidoc = {
		data: _.flatten(jsonapidocs.map(d => d.data))
	}

	jsonapidoc.data = jsonapidoc.data.filter(removeLongDocsBecauseEmber1HasWeirdDocs)

	let projectVersions = pVersions.map(version => {
		let classes = findType(jsonapidoc, 'class')
			.filter(filterForVersion(version))
			.filter(removeLongDocsBecauseEmber1HasWeirdDocs)

		let namespaces = classes.filter(doc => doc.attributes.static === 1)
		classes = classes.filter(
			doc => doc.attributes.static !== 1 && doc.attributes.hasOwnProperty('file')
		)

		namespaces.forEach(ns => {
			ns.type = 'namespace'
		})

		let modules = findType(jsonapidoc, 'module')
			.filter(filterForVersion(version))
			.filter(_.curry(filter176)(projectName, version.version))

		return {
			id: `${projectName}-${version.version}`,
			type: 'project-version',
			attributes: {
				version: version.version
			},
			relationships: {
				classes: {
					data: classes.map(extractRelationship)
				},
				namespaces: {
					data: namespaces.map(extractRelationship)
				},
				modules: {
					data: modules.map(extractRelationship)
				},
				project: {
					data: {
						id: projectName,
						type: 'project'
					}
				},
				'private-classes': {
					data: classes.filter(isPrivate).map(extractRelationship)
				},
				'public-classes': {
					data: classes.filter(isPublic).map(extractRelationship)
				},
				'private-namespaces': {
					data: namespaces.filter(isPrivate).map(extractRelationship)
				},
				'public-namespaces': {
					data: namespaces.filter(isPublic).map(extractRelationship)
				},
				'private-modules': {
					data: modules.filter(isPrivate).map(extractRelationship)
				},
				'public-modules': {
					data: modules.filter(isPublic).map(extractRelationship)
				}
			}
		}
	})

	let versionDocs = RSVP.map(projectVersions, projectVersion => {
		let doc = {
			data: projectVersion
		}

		let version = projectVersion.attributes.version

		return saveDoc(doc, projectName, version)
	})

	let doc = {
		data: jsonapidoc.data.concat(projectVersions)
	}
	return versionDocs.then(() => doc)
}

module.exports = normalizeIDs
