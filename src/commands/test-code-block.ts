import { Command } from '@oclif/command'
import 'hard-rejection/register'

import { transpileCodeBlock } from '../lib/code-processor/transpile-code-blocks'

import { AppStore } from './../lib/classes/app-store'

const codeBlock =
	'[Glimmer](https://github.com/tildeio/glimmer) is a templating engine used by Ember.js that is compatible with a subset of the [Handlebars](http://handlebarsjs.com/) syntax.\n\n### Showing a property\n\nTemplates manage the flow of an application\'s UI, and display state (through\nthe DOM) to a user. For example, given a component with the property "name",\nthat component\'s template can use the name in several ways:\n\n```app/components/person-profile.js\nimport Component from \'@ember/component\';\n\nexport default Component.extend({\n  name: \'Jill\'\n});\n```\n\n```app/components/person-profile.hbs\n{{this.name}}\n<div>{{this.name}}</div>\n<span data-name={{this.name}}></span>\n```\n\nAny time the "name" property on the component changes, the DOM will be\nupdated.\n\nProperties can be chained as well:\n\n```handlebars\n{{@aUserModel.name}}\n<div>{{@listOfUsers.firstObject.name}}</div>\n```\n\n### Using Ember helpers\n\nWhen content is passed in mustaches `{{}}`, Ember will first try to find a helper\nor component with that name. For example, the `if` helper:\n\n```app/components/person-profile.hbs\n{{if this.name "I have a name" "I have no name"}}\n<span data-has-name={{if this.name true}}></span>\n```\n\nThe returned value is placed where the `{{}}` is called. The above style is\ncalled "inline". A second style of helper usage is called "block". For example:\n\n```handlebars\n{{#if this.name}}\n  I have a name\n{{else}}\n  I have no name\n{{/if}}\n```\n\nThe block form of helpers allows you to control how the UI is created based\non the values of properties.\nA third form of helper is called "nested". For example here the concat\nhelper will add " Doe" to a displayed name if the person has no last name:\n\n```handlebars\n<span data-name={{concat this.firstName (\n  if this.lastName (concat " " this.lastName) "Doe"\n)}}></span>\n```\n\nEmber\'s built-in helpers are described under the [Ember.Templates.helpers](/ember/release/classes/Ember.Templates.helpers)\nnamespace. Documentation on creating custom helpers can be found under\n[helper](/ember/release/functions/@ember%2Fcomponent%2Fhelper/helper) (or\nunder [Helper](/ember/release/classes/Helper) if a helper requires access to\ndependency injection).\n\n### Invoking a Component\n\nEmber components represent state to the UI of an application. Further\nreading on components can be found under [Component](/ember/release/classes/Component).'

export default class TestCodeBlock extends Command {
	static description = 'Tests code block generator'

	async run() {
		AppStore.init({ dataDir: process.cwd() })

		const result = await transpileCodeBlock(codeBlock)

		console.log(result)

		console.log(`Published locally to ${AppStore.config.get('dataDir')}`)
	}
}
