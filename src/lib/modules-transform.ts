import * as SafePromise from 'bluebird'
import * as _ from 'lodash'

function addSubModulesParentAttribute(moduleObj: any) {
	moduleObj.parent = moduleObj.is_submodule ? moduleObj.module : null
}

function filterStaticAndDerived(classes: any, className: string) {
	let included =
		(_.has(classes, className) &&
			!_.has(classes[className], 'static') &&
			_.has(classes[className], 'file')) ||
		!_.has(classes, className)
	return included
}

function addPrivatePublicClassesAttributes(module: any, classes: any) {
	let classNames = Object.keys(module.classes)
	let applicableClassNames = _.filter(classNames, _.curry(filterStaticAndDerived)(classes))

	let [privateclasses, publicclasses] = _.partition(applicableClassNames, (className: string) => {
		return classes[className].access === 'private' || classes[className].deprecated === true
	})
	module.publicclasses = publicclasses
	module.privateclasses = privateclasses
	delete module.classes
}

function isPublicStaticMethod(item: any) {
	return item.itemtype === 'method' && item.access === 'public' && item.static === 1
}

function isStaticMethod(item: any) {
	return item.itemtype === 'method' && item.static === 1
}

function separateByClassName(result: any, value: any) {
	;(result[value.class] || (result[value.class] = [])).push(value)
	return result
}

function sortByName(items: any[]) {
	return _.sortBy(items, 'name')
}

function separateFunctions(moduleName: string, classitems: any[], accessFilter: any) {
	let matchesModule = ({ module }: any) => module === moduleName
	return _.flow([
		_.curryRight(_.filter)(matchesModule),
		_.curryRight(_.filter)(accessFilter),
		sortByName,
		_.curryRight(_.reduce)(separateByClassName, {}),
	])(classitems)
}

function cleanUpSubmodules({ submodules }: any) {
	return _.flow([
		_.curryRight(_.filter)((item: any) => item !== 'undefined'),
		_.curryRight(_.reduce)((result: any, value: any) => {
			result[value] = 1
			return result
		}, {}),
	])(Object.keys(submodules))
}

export default function transformModules(doc: any) {
	let { data } = doc

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

	return SafePromise.resolve(doc)
}
