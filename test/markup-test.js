import { fixFilename } from '../lib/markup.js';
import { assert } from 'chai';
import fsExtra from 'fs-extra';
import { join } from 'path';

const { readFileSync, readdirSync } = fsExtra;

const inputFiles = readdirSync('./test/mocks/input');

describe('markup', () => {
  for (let file of inputFiles) {
    it(`render correct syntax for ${file}`, function () {
      const inputFile = readFileSync(join('./test/mocks/input', file), 'utf-8');
      const outputFile = readFileSync(join('./test/mocks/output', file), 'utf-8');

      assert.equal(fixFilename(inputFile), outputFile);
    });
  }
});
