const RSVP = require('rsvp')
const uploadDocsToS3 = require('./s3-sync').uploadDocsToS3

// Only run this script if you have confirmed that the tmp directory's
// contents render correctly in the ember-api-docs app, using
// `npm run start:local` for the front end.
// There are no safety checks here!
async function apiDocsProcessor () {
	console.log('Beginning S3 upload of the contents of tmp directory')
	RSVP.on('error', reason => {
		console.log(reason)
		process.exit(1)
	})

	await uploadDocsToS3()
		.then(() => {
			console.log('\n\n\n')
			console.log('Done!')
		})
}

apiDocsProcessor()