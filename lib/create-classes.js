import saveDoc from './save-document.js'

export default async function (document, projectName, projectVersion) {
  let things = document.data

  for (const klass of things) {
    if (!klass.id) {
      console.log(klass)
      console.log(new Error('WHAT').stack)
      process.exit(1)
    }
    const doc = {
      data: klass,
    }

    console.log(`Creating ${klass.id} in ${projectName}-${projectVersion}`)
    await saveDoc(doc, projectName, projectVersion)
  }

  return document
}
