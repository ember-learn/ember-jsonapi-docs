import keyfinder from 'keyfinder';
import { uniq } from 'lodash-es';
import { createRequire } from 'node:module';
import fs from 'fs-extra';

const require = createRequire(import.meta.url);
const moduleDataPath = require.resolve('ember-rfc176-data');
const moduleData = fs.readJsonSync(moduleDataPath);

export const emberKnownEntityNames = uniq(keyfinder(moduleData, 'export'));
