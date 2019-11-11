import * as fileExtension from 'file-extension'
import * as createPlugin from 'gatsby-remark-vscode/src'
import * as reparseHast from 'hast-util-raw'
import * as mdastToHast from 'mdast-util-to-hast'
import * as stringify from 'rehype-stringify'
import * as remark from 'remark-parse'
import * as unified from 'unified'
import * as visit from 'unist-util-visit'

const processor = unified()
	.use(remark)
	// @ts-ignore
	.use(stringify, { sanitize: false })

const markdownNode = { fileAbsolutePath: 'text.md' }
const cache = new Map()

/* let listOfExtensions = readJSONSync('node_modules/gatsby-remark-vscode/lib/grammars/manifest.json')

listOfExtensions = uniq(
	flatten(Object.values(listOfExtensions).map(({ languageNames }) => languageNames))
) */

// const listOfExtensions = ['js', 'hbs']

const plugin = createPlugin()
const codeBlockStr = 'wasCodeBlock: true'
const styleTag = '<style class="vscode-highlight-styles">'

const internalCache = new WeakMap()

export async function transpileCodeBlock(text = '') {
	if (internalCache.get({ text })) {
		return internalCache.get({ text })
	}

	const markdownAST = processor.parse(Buffer.from(text))

	visit(markdownAST, 'code', node => {
		let originalContent = node.lang

		if (node.lang === 'javscript') {
			node.lang = 'js'
		}

		if (node.lang === null) {
			node.lang = 'text'
		}

		if (originalContent && (originalContent.includes('/') || originalContent.includes('.'))) {
			node.lang = fileExtension(originalContent)
			node.meta = `fileName: "${originalContent}" `
		}

		if (node.meta) {
			node.meta = `{ ${codeBlockStr}, ${node.meta} }`
		} else {
			node.meta = `{ ${codeBlockStr} }`
		}
	})

	await plugin(
		{ markdownAST, markdownNode, cache },
		{
			injectStyles: false,
			extensions: [],
			colorTheme: {
				defaultTheme: 'Monokai', // Required
				// prefersDarkTheme: 'Monokai Dimmed', // Optional: used with `prefers-color-scheme: dark`
				// prefersLightTheme: 'Quiet Light', // Optional: used with `prefers-color-scheme: light`
			},
		}
	)

	visit(markdownAST, 'html', node => {
		if (node.meta && node.meta.includes(codeBlockStr)) {
			try {
				let metaInfo = eval(`{() => (${node.meta}) }`)()
				let dataInfo = ''
				if (metaInfo && metaInfo.fileName) {
					dataInfo = `data-file-name="${metaInfo.fileName}" `
				}
				dataInfo += ` data-language="${node.lang}"`
				node.value = `<div class="vscode-highlight" ${dataInfo}>${node.value}</div>`
			} catch (err) {
				console.log(err)
			}
		}

		if (node.value.startsWith(styleTag)) {
			// let styles = node.value.replace(styleTag, '').replace('</style>', '')
			// fs.writeFileSync('styles.css', styles, 'utf-8')
			node.value = ''
		}
	})

	const html = processor.stringify(
		reparseHast(mdastToHast(markdownAST, { allowDangerousHTML: true }))
	)

	internalCache.set({ text }, html)
	return html
}
