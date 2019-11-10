// import { transpileCodeBlock } from './transpile-code-blocks'

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

function replaceDescriptionFor(items = []) {
	items.forEach(item => {
		let itemDescription = item.description
		if (itemDescription) {
			item.description = highlight(itemDescription)
		}
	})
}

function highlight(description) {
	return description
}
