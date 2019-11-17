# Ember JSON API Docs [![Build Status](https://travis-ci.org/ember-learn/ember-jsonapi-docs.svg?branch=master)](https://travis-ci.org/ember-learn/ember-jsonapi-docs)

If you are looking for the app behind https://emberjs.com/api/, visit
[ember-api-docs](https://github.com/ember-learn/ember-api-docs) instead. This ember-jsonapi-docs
repository is internal tooling that is not required to run the ember-api-docs app locally.

`ember-jsonapi-docs` is for turning code comments in [ember.js](https://github.com/emberjs/ember.js) & [ember-data](https://github.com/emberjs/data) into [json api](http://jsonapi.org/) compliant data for use in various applications seeking to use the Ember API.

The script pulls yuidoc build outputs from releases, converts it to json api format and publishes them to s3.

## Running the app

1. Fork/Clone [ember-jsonapi-docs](https://github.com/ember-learn/ember-jsonapi-docs)
1. Run `yarn`
1. Run `yarn start`
   - if you additionally like to publish this to the official s3 bucket, then pass the `--publish` flag

## Generating API Documentation and Testing API Docs Locally

## Backing up docs before running major migrations

## If you plan to run a major migration run `yarn backup` so that all the content are safely backed up to a timestamped s3 folder.

1. Install the [aws cli](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)
1. Set up AWS access

   ```shell
   export AWS_ACCESS_KEY_ID=xxxxxx
   export AWS_SECRET_ACCESS_KEY=xxxxx
   ```

   The app accesses builds.emberjs.com (an Amazon S3 bucket) in read-only mode, which is public. This requires any valid AWS credentials.

   You can get your credentials by logging into your [AWS console](https://console.aws.amazon.com) and navigating to "_My Security Credentials_" under your profile name. You can generate a new pair under the "_Access Keys (Access Key ID and Secret Access Key)_" section.

1) To test your changes in the app run,
   `yarn start`
   The app tries to process all ember & ember-data versions since 1.0 which takes high memory & time to complete. If you intend it, then run `yarn start --max_old_space_size=8192`.
   You are setting your node max heap space to 8GB, so make sure you have that much space available on your machine.
