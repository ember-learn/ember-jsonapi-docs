import _ from 'lodash'
import RSVP from 'rsvp'

function addSubModulesParentAttribute(moduleObj) {
	moduleObj.parent = moduleObj.is_submodule ? moduleObj.module : null
}

function filterStaticAndDerived(classes, className) {
	let included =
		(_.has(classes, className) &&
			!_.has(classes[className], 'static') &&
			_.has(classes[className], 'file')) ||
		!_.has(classes, className)
	return included
}

function addPrivatePublicClassesAttributes(module, classes) {
	let classNames = Object.keys(module.classes)
	let applicableClassNames = _.filter(classNames, _.curry(filterStaticAndDerived)(classes))
	let partitionedClasses = _.partition(applicableClassNames, className => {
		return (
			classes[className].access === 'private' ||
			classes[className].deprecated === true ||
			!_.has(classes[className], 'access')
		)
	})
	module.publicclasses = partitionedClasses[1]
	module.privateclasses = partitionedClasses[0]
	delete module.classes
}

function isPublicStaticMethod(item) {
	return item.itemtype === 'method' && item.access === 'public' && item.static === 1
}

function isStaticMethod(item) {
	return item.itemtype === 'method' && item.static === 1
}

function separateByClassName(result, value) {
	(result[value.class] || (result[value.class] = [])).push(value)
	return result
}

function sortByName(items) {
	return _.sortBy(items, 'name')
}

function separateFunctions(moduleName, classitems, accessFilter) {
	let matchesModule = ({ module }) => module === moduleName
	return _.flow([
		_.curryRight(_.filter)(matchesModule),
		_.curryRight(_.filter)(accessFilter),
		sortByName,
		_.curryRight(_.reduce)(separateByClassName, {}),
	])(classitems)
}

function cleanUpSubmodules({ submodules }) {
	return _.flow([
		_.curryRight(_.filter)(item => item !== 'undefined'),
		_.curryRight(_.reduce)((result, value) => {
			result[value] = 1
			return result
		}, {}),
	])(Object.keys(submodules))
}

export default function transformModules(docSets) {
	docSets.forEach(({ data }) => {
		let modules = _.values(data.modules)
		let classes = data.classes
		let classitems = data.classitems
		modules.forEach(mod => {
			addSubModulesParentAttribute(mod)
			addPrivatePublicClassesAttributes(mod, classes)
			mod.staticfunctions = separateFunctions(mod.name, classitems, isPublicStaticMethod)
			mod.allstaticfunctions = separateFunctions(mod.name, classitems, isStaticMethod)
			mod.submodules = cleanUpSubmodules(mod)
		})
	})

	return RSVP.resolve(docSets)
}
