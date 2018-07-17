import marked from 'marked'
import hljs from 'highlight.js'
import cheerio from 'cheerio'

marked.setOptions({
	highlight: code => hljs.highlightAuto(code).value,
})

export default doc => {
	doc.data.forEach(({ id, attributes }) => {
		console.log(`Generating markup for ${id}`)

		let description = attributes.description

		if (description) {
			attributes.description = highlight(description)
		}

		replaceDescriptionFor(attributes.methods)
		replaceDescriptionFor(attributes.properties)
		replaceDescriptionFor(attributes.events)
	})

	return doc
}

function replaceDescriptionFor(items) {
	if (items) {
		items.forEach(item => {
			let itemDescription = item.description
			if (itemDescription) {
				item.description = highlight(itemDescription)
			}
		})
	}
}

function highlight(description) {
	let markedup = removeHLJSPrefix(marked(description))
	let $ = cheerio.load(markedup)

	let codeBlocks = $('pre code')

	codeBlocks.each((i, el) => {
		let element = $(el)
		let klass = element.attr('class')
		let lang = ''
		let tableHeader = ''
		if (klass) {
			let type = klass.split('-').pop()
			if (isFile(type)) {
				tableHeader = `
          <thead>
            <tr>
              <td colspan="2">${type}</td>
            </tr>
          </thead>`
			}
			lang = determineLanguage(type)
		}
		let lines = element.html().split('\n')

		// get rid of empty blank line
		if (lines[lines.length - 1].trim() === '') {
			lines.pop()
		}

		let wrappedLines = `<pre>${lines.join('\n')}</pre>`
		let lineNumbers = lines.map((_, i) => `${i + 1}\n`).join('')

		element.parent().after(`<div class="highlight ${lang}">
      <div class="ribbon"></div>
      <div class="scroller">
        <table class="CodeRay">${tableHeader}
          <tbody>
            <tr>
              <td class="line-numbers"><pre>${lineNumbers}</pre></td>
              <td class="code">${wrappedLines}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    `)

		element.parent().remove()
	})

	return $.html()
}

function determineLanguage(lang) {
	switch (lang) {
	case 'js':
	case 'javascript':
		return 'javascript'
	default:
		return lang
	}
}

function removeHLJSPrefix(string) {
	return string.replace(/hljs-/g, '')
}

function isFile(string) {
	return /\./.test(string)
}
