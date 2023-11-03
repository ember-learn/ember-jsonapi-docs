import { uploadDocsToS3 } from './lib/s3-sync.js'
import readline from 'readline'

// Only run this script if you have confirmed that the tmp directory's
// contents render correctly in the ember-api-docs app, using
// `npm run start:local` for the front end.
// There are no safety checks here!
async function uploadPreviouslyBuiltDocsToS3() {
	const prompt = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})

	prompt.question(
		'This command uploads the current contents of the tmp folder to AWS, without building the docs first. Are you sure you want to do this? yes/no \n',
		async response => {
			if (response === 'yes') {
				console.log('Beginning S3 upload of the contents of tmp directory')

				await uploadDocsToS3()
					.then(() => {
						console.log('\n\n\n')
						console.log('Done!')
					})
					.catch(err => {
						console.log(err)
						process.exit(1)
					})
			}
			prompt.close()
		}
	)
}

uploadPreviouslyBuiltDocsToS3()
