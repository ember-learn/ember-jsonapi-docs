import * as fs from 'fs-extra'
import * as path from 'path'

//TODO: download extensions at the beginning of the build
// sample url: https://marketplace.visualstudio.com/_apis/public/gallery/publishers/teabyii/vsextensions/ayu/0.18.0/vspackage
const extensionsFolder = path.join(__dirname, 'extensions')

const extensions: any[] = fs
	.readdirSync(extensionsFolder)
	.filter(fileName => !fileName.startsWith('.'))
	.map(fileName => path.join(extensionsFolder, fileName))

export const vscodePluginConfig = {
	injectStyles: false,

	theme: {
		default: 'Ayu Mirage Bordered',
		dark: 'Ayu Mirage Bordered',
		light: 'Ayu Light Bordered',

		parentSelector: {
			// Any CSS selector will work!
			'html[data-theme=dark]': 'Ayu Mirage Bordered',
			'html[data-theme=light]': 'Ayu Light Bordered',
			// 'html[data-theme=hc]': 'Ayu Mirage Bordered',
		},
	},

	extensions,

	languageAliases: {
		text: 'mdtxt',
		cli: 'sh',
		handelbars: 'handlebars',
	},
}
