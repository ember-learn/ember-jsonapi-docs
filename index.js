import minimist from 'minimist';
import { apiDocsProcessor } from './main.js';

const argv = minimist(process.argv.slice(2));

let possibleProjects = ['ember', 'ember-data'];
let projects =
  argv.project && possibleProjects.includes(argv.project) ? [argv.project] : possibleProjects;
let specificDocsVersion = argv.version ? argv.version : '';

let runClean = !!argv.clean;
let noSync = !argv.sync;

apiDocsProcessor(projects, specificDocsVersion, runClean, noSync);
