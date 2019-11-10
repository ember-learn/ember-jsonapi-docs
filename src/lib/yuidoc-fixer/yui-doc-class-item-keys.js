import { without } from 'lodash'

const originalYuiDocClassItemKeys = [
	'async', // bool, custom events can fire the listeners in a setTimeout
	'author', // author best for projects and modules, but can be used anywhere // multi
	'attribute', // YUI attributes / custom element attributes
	'beta', // module maturity identifier
	'broadcast', // bool, events
	'bubbles', // custom events that bubble
	'category', // modules can be in multiple categories
	'chainable', // methods that return the host object
	'class', // pseudo class
	'conditional', // conditional module
	'config', // a config param (not an attribute, so no change events)
	'const', // not standardized yet, converts to final property
	'constructs', // factory methods (not yet used)
	'constructor', // this is a constructor
	'content', // permitted content for an @element
	'contributor', // like author
	'default', // property/attribute default value
	'deprecated', // please specify what to use instead
	'description', // can also be free text at the beginning of a comment is
	'emitfacade', // bool, YUI custom event can have a dom-like event facade
	'element', // Web Components custom element
	'event', // YUI custom event
	'evil', // uses eval
	'extension', // this is an extension for [entity]
	'extensionfor', // this is an extension for [entity]
	'extension_for', // this is an extension for [entity]
	'example', // 0..n code snippets.  snippets can also be embedded in the desc
	'experimental', // module maturity identifier
	'extends', // pseudo inheritance
	'file', // file name (used by the parser)
	'final', // not meant to be changed
	'fireonce', // bool, YUI custom event config allows
	'for', // used to change class context
	'global', // declare your globals
	'icon', // project icon(s)
	'implements', // Implements Interface
	'in', // indicates module this lives in (obsolete now)
	'initonly', // attribute writeonce value
	'injects', // injects {HTML|script|CSS}
	'interface', // Is Interface / Interface for an @element
	'knownissue', // 0..n known issues for your consumption
	'line', // line number for the comment block (used by the parser)
	'method', // a method
	'module', // YUI module name
	'main', // Description for the module
	'namespace', // Y.namespace, used to fully qualify class names
	'optional', // For optional attributes
	'required', // For required attributes
	'param', // member param
	'parents', // permitted parents for an @element
	'plugin', // this is a plugin for [entityl]
	'preventable', // YUI custom events can be preventable ala DOM events
	'private', // > access
	'project', // project definition, one per source tree allowed
	'property', // a regular-ole property
	'protected', // > access
	'public', // > access
	'queuable', // bool, events
	'readonly', // YUI attribute config
	'requires', // YUI module requirements
	'return', // {type} return desc -- returns is converted to this
	'see', // 0..n things to look at
	'since', // when it was introduced
	'static', // static
	'submodule', // YUI submodule
	'throws', // {execption type} description
	'title', // this should be something for the project description
	'todo', // 0..n things to revisit eventually (hopefully)
	'type', // the var type
	'url', // project url(s)
	'uses', // 0..n compents mixed (usually, via augment) into the prototype
	'value', // the value of a constant
	'writeonce', // YUI attribute config
]

const additionalDocumentationKeywords = [
	'access',
	'tagname',
	'itemtype',
	'params',
	'name',
	'is_constructor',
]

const keywordsInOurProjects = ['readonly']

export const yuiDocClassItemKeys = without(
	[...additionalDocumentationKeywords, ...originalYuiDocClassItemKeys],
	...keywordsInOurProjects
)
