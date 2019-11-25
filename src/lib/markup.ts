import * as SafePromise from 'bluebird'

import { transpileCodeBlock } from './code-processor/transpile-code-blocks'

export default async (doc: any) => {
	await SafePromise.map(
		doc.data,
		async (data: any) => {
			let id: string = data.id
			let attributes: any = data.attributes

			console.log(`Generating markup for ${id}`)

			let description = attributes.description

			if (description) {
				attributes.description = await highlight(description)
			}

			await replaceDescriptionFor(attributes.methods)
			await replaceDescriptionFor(attributes.properties)
			await replaceDescriptionFor(attributes.events)
		},
		{ concurrency: 10 }
	)

	return SafePromise.resolve(doc)
}

async function replaceDescriptionFor(items = []) {
	SafePromise.map(items, async (item: any) => {
		let itemDescription = item.description
		if (itemDescription) {
			item.description = await highlight(itemDescription)
		}
	})
}

async function highlight(description: string) {
	return transpileCodeBlock(description)
}
