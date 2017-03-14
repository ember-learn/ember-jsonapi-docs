const byType = require('./filter-jsonapi-doc').byType

module.exports = function getVersionIndex (doc, projectName) {
  return {
    data: {
      id: projectName,
      type: 'project',
      attributes: {
        'github-url': 'https://github.com/emberjs/ember.js'
      },
      relationships: {
        'project-versions': {
          data: byType(doc, 'project-version').map(item => {
            return {
              id: item.id,
              type: item.type
            }
          })
        }
      }
    }
  }
}
