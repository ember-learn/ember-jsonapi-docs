import { byType } from './filter-jsonapi-doc.js'

export default function getVersionIndex(doc, projectName) {
  return {
    data: {
      id: projectName,
      type: 'project',
      attributes: {
        'github-url': 'https://github.com/emberjs/ember.js',
      },
      relationships: {
        'project-versions': {
          data: byType(doc, 'project-version').map(({ id, type }) => {
            return {
              id,
              type,
            }
          }),
        },
      },
    },
  }
}
