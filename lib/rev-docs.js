import fs from 'fs-extra';
import ora from 'ora';
import { basename as getFileName } from 'path';
import { singularize } from 'inflected';
import path from 'path';
const glob = require('glob');

const docsPath = '../ember-api-docs-data';

function revProjVersionFiles(project, ver) {
  let opProgress = ora(`Revving ${project}:${ver} files`).start();
  const projDocsDir = path.resolve(`${docsPath}/json-docs/${project}`);
  const revIndexFolder = path.resolve(`${docsPath}/rev-index`);

  fs.mkdirpSync(revIndexFolder);
  const destination = `${revIndexFolder}/${project}-${ver}.json`;

  fs.copySync(`${projDocsDir}/${ver}/project-versions/${project}-${ver}.json`, destination);

  opProgress.text = `Revving ${project}:${ver}`;

  const projVerRevFile = `${revIndexFolder}/${project}-${ver}.json`;
  let projVerRevContent = fs.readJsonSync(projVerRevFile);
  projVerRevContent.meta = {};

  Object.keys(projVerRevContent.data.relationships).forEach(k => {
    if (Array.isArray(projVerRevContent.data.relationships[k].data)) {
      projVerRevContent.data.relationships[k].data.forEach(({ type, id }) => {
        if (!projVerRevContent.meta[type]) {
          projVerRevContent.meta[type] = {};
        }
        projVerRevContent.meta[type][id] = '';
      });
    } else if (k !== 'project') {
      let d = projVerRevContent.data.relationships[k].data;
      if (!projVerRevContent.meta[d.type]) {
        projVerRevContent.meta[d.type] = {};
      }
      projVerRevContent.meta[d.type][d.id] = '';
    }
  });
  projVerRevContent.meta['missing'] = {};

  const projVerDir = `${projDocsDir}/${ver}`;
  glob
    .sync(`${projVerDir}/**/*.json`)
    .filter(f => !f.includes('project-versions'))
    .map(f => {
      let fileShortName = f.replace(`${projVerDir}/`, '').replace('.json', '');
      let [fileObjType, entityName] = fileShortName.split('/');

      projVerRevContent.meta[singularize(fileObjType)][entityName] = getFileName(f).replace(
        '.json',
        '',
      );
    });

  fs.writeJsonSync(projVerRevFile, projVerRevContent);
  opProgress.succeed('Revving done!');
}

export default revProjVersionFiles;
