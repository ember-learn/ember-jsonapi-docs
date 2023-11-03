import markup from '../lib/markup.js';
import { assert } from 'chai';
import fs from 'fs';

function desc(path) {
  return {
    id: Date.now(),
    attributes: {
      description: fs.readFileSync(`./test/mocks/description/${path}.md`, 'utf-8'),
      methods: [],
      properties: [],
      events: [],
    },
  };
}

function mark(path) {
  let data = [desc(path)];
  let result = markup({ data });
  let content = result.data[0].attributes.description;
  maybeWrite(content, path);
  return content;
}

function maybeWrite(content, path) {
  const fsPath = `./test/mocks/description/${path}.html`;
  if (fs.existsSync(fsPath)) {
    return;
  }
  fs.writeFileSync(fsPath, content, 'utf-8');
}

function snapshot(path) {
  const fsPath = `./test/mocks/description/${path}.html`;
  return fs.readFileSync(fsPath, 'utf8');
}

describe('markup', () => {
  it('render correct syntax for handlebars with title', function () {
    const caseName = 'handlebars-title';
    assert.equal(mark(caseName), snapshot(caseName));
  });

  it('render correct syntax for handlebars without title', function () {
    const caseName = 'handlebars';
    assert.equal(mark(caseName), snapshot(caseName));
  });

  it('render correct syntax for javascript with title', function () {
    const caseName = 'javascript-title';
    assert.equal(mark(caseName), snapshot(caseName));
  });

  it('render correct syntax for javascript without title', function () {
    const caseName = 'javascript';
    assert.equal(mark(caseName), snapshot(caseName));
  });
});
