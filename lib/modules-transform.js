import { curry, curryRight, filter, flow, has, partition, reduce, sortBy, values } from 'lodash-es';

function addSubModulesParentAttribute(moduleObj) {
  moduleObj.parent = moduleObj.is_submodule ? moduleObj.module : null;
}

function filterStaticAndDerived(classes, className) {
  let included =
    (has(classes, className) &&
      !has(classes[className], 'static') &&
      has(classes[className], 'file')) ||
    !has(classes, className);
  return included;
}

function addPrivatePublicClassesAttributes(module, classes) {
  let classNames = Object.keys(module.classes);
  let applicableClassNames = filter(classNames, curry(filterStaticAndDerived)(classes));

  let [privateclasses, publicclasses] = partition(applicableClassNames, className => {
    return classes[className].access === 'private' || classes[className].deprecated === true;
  });
  module.publicclasses = publicclasses;
  module.privateclasses = privateclasses;
  delete module.classes;
}

function isPublicStaticMethod(item) {
  return item.itemtype === 'method' && item.access === 'public' && item.static === 1;
}

function isStaticMethod(item) {
  return item.itemtype === 'method' && item.static === 1;
}

function separateByClassName(result, value) {
  (result[value.class] || (result[value.class] = [])).push(value);
  return result;
}

function sortByName(items) {
  return sortBy(items, 'name');
}

function separateFunctions(moduleName, classitems, accessFilter) {
  let matchesModule = ({ module }) => module === moduleName;
  return flow([
    curryRight(filter)(matchesModule),
    curryRight(filter)(accessFilter),
    sortByName,
    curryRight(reduce)(separateByClassName, {}),
  ])(classitems);
}

function cleanUpSubmodules({ submodules }) {
  return flow([
    curryRight(filter)(item => item !== 'undefined'),
    curryRight(reduce)((result, value) => {
      result[value] = 1;
      return result;
    }, {}),
  ])(Object.keys(submodules));
}

export default function transformModules(docSets) {
  try {
    docSets.forEach(({ data }) => {
      let modules = values(data.modules);
      let classes = data.classes;
      let classitems = data.classitems;
      modules.forEach(mod => {
        addSubModulesParentAttribute(mod);
        addPrivatePublicClassesAttributes(mod, classes);
        mod.staticfunctions = separateFunctions(mod.name, classitems, isPublicStaticMethod);
        mod.allstaticfunctions = separateFunctions(mod.name, classitems, isStaticMethod);
        mod.submodules = cleanUpSubmodules(mod);
      });
    });
  } catch (e) {
    return Promise.reject(e);
  }

  return Promise.resolve(docSets);
}
