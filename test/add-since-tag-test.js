import addSinceTags from '../lib/add-since-tags.js';
import { assert } from 'chai';
import _ from 'lodash';

describe('addSinceTags', () => {
  beforeEach(function () {
    this.yuiDocSets = _.range(3).map(i => {
      return {
        version: `v1.0.${i}`,
        data: {
          classitems: [
            {
              itemtype: 'method',
              name: 'foo',
              class: 'Foo',
            },
            {
              itemtype: 'method',
              name: 'bar',
              class: 'Foo',
            },
          ],
        },
      };
    });
    addSinceTags(this.yuiDocSets);
  });

  it('adds a since tag to classitems', function () {
    this.yuiDocSets.forEach(({ data }) => {
      data.classitems.forEach(({ since }) => assert.equal(since, '1.0.0'));
    });
  });
});
