import * as path from 'path'

const extensions: any[] = [
	// {
	// 	identifier: 'BeardedBear.beardedtheme',
	// 	version: '1.6.2',
	// },
	// {
	// 	identifier: 'emberjs.emberjs',
	// 	version: '1.0.1',
	// },
	// {
	// 	identifier: 'lifeart.vscode-glimmer-syntax',
	// 	version: '0.0.18',
	// },
	// {
	// 	identifier: 'lifeart.vscode-ember-unstable',
	// 	version: '0.2.43',
	// },
]

const extensionDataDirectory = path.join(__dirname, './extensions/')

export const vscodePluginConfig = {
	injectStyles: false,
	extensions,
	extensionDataDirectory,
	colorTheme: {
		defaultTheme: 'Solarized Dark', // Required
		prefersDarkTheme: 'Solarized Dark', // Optional: used with `prefers-color-scheme: dark`
		prefersLightTheme: 'Solarized Light', // Optional: used with `prefers-color-scheme: light`
	},
}
