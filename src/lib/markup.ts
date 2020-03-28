import * as SafePromise from 'bluebird'

import { transpileCodeBlock } from './code-processor/transpile-code-blocks'

export default async (doc: any) => {
	await SafePromise.map(
		doc.data,
		async (data: any) => {
			let id: string = data.id
			let attributes: any = data.attributes

			console.log(`Generating markup for ${id}`)

			let { description, example } = attributes

			if (example) {
				let transpiledExamples = await Promise.all(
					example.map((code: string) => transpileCodeBlock(code))
				)
				attributes.example = transpiledExamples
			}

			if (description) {
				attributes.description = await transpileCodeBlock(description)
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
		let { description, example } = item
		if (description) {
			item.description = await transpileCodeBlock(description)
		}

		if (example) {
			let transpiledExamples = await Promise.all(
				example.map((code: string) => transpileCodeBlock(code))
			)
			item.example = transpiledExamples
		}
	})
}
