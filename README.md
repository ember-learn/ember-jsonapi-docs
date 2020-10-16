# Ember JSON API Docs [![Build Status](https://travis-ci.org/ember-learn/ember-jsonapi-docs.svg?branch=master)](https://travis-ci.org/ember-learn/ember-jsonapi-docs)

This is an internal tool for generating API docs for the Ember.js framework and exposing it through [JSON:API](http://jsonapi.org/) for various applications (e.g. https://api.emberjs.com/). The tool allows you to:

- Generate API docs from [YUIDoc](http://yui.github.io/yuidoc/syntax/index.html) comments in the [emberjs/ember.js](https://github.com/emberjs/ember.js/) and [emberjs/data](https://github.com/emberjs/data) repositories in [YUIDoc](http://yui.github.io/yuidoc/) and [JSON:API](http://jsonapi.org/) formats.
- Publish docs to an Amazon S3 bucket (`s3://api-docs.emberjs.com`).
- Expose API docs in the JSON:API format through API.

All the generated files are stored in the `tmp` folder under the project root:

```
tmp
├── json-docs   // JSON:API-comlaint docs generated locally from YUIDoc files in `s3-docs`.
├── rev-index   // Rev index files used for generating JSON:API-comlaint docs.
├── s3-docs     // YUIDoc docs generated locally or downloaded from s3://api-docs.emberjs.com.
```

> ℹ️ **NOTE:** If you are looking for the app behind https://api.emberjs.com/, visit [ember-api-docs](https://github.com/ember-learn/ember-api-docs) instead.

## Prerequisites

1. Install the latest [Node.js](https://nodejs.org/) LTS.
2. Install [AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html).
3. Create an account in [AWS Management Console](https://console.aws.amazon.com). [Create a New Access Key](https://docs.aws.amazon.com/general/latest/gr/managing-aws-access-keys.html) (access key ID and secret access key) in *My Security Credentials* under your profile name to be able to access public AWS S3 buckets.

## Quickstart

### Generate Docs from Ember Source

You can generate docs from your local copies of [emberjs/ember.js](https://github.com/emberjs/ember.js/) and [emberjs/data](https://github.com/emberjs/data) repositories and serve them locally as [JSON:API](http://jsonapi.org/).

```bash
# Clone Ember.js and Ember Data repositories into the same root folder.
git clone https://github.com/emberjs/ember.js/
git clone https://github.com/emberjs/data

# Clone this repository into the same root folder.
git clone https://github.com/ember-learn/ember-jsonapi-docs
cd ember-jsonapi-docs

# Install the dependencies.
yarn

# Generate docs for a particular project from its local repository.
# Version should match the one in `package.json` of a target project.
yarn gen --project ember --version 3.17.0
yarn gen --project ember-data --version 3.17.0

# Run API locally.
yarn serve
```

> ℹ️ **NOTE:** `--version` should match the one in the `package.json` of a target Ember project. If `package.json` uses a release name (e.g. `beta` or `canary`), omit it and use only numbers. For example, if the `package.json` says `3.19.0-beta.2`, use `3.19.0`.

> ✅ **TIP:** If you are debugging failed builds, periodically clear out the contents of the `tmp` directory, and run the script again. Past failed runs can cause subsequent runs to fail in unexpected ways.

### Generate Docs from YUIDoc Files Stored in AWS

All [Ember.js](https://github.com/emberjs/ember.js/) and [Ember.js Data](https://github.com/emberjs/data) releases have already generated docs in a public Amazon S3 bucket (`s3://api-docs.emberjs.com`). You can download them and serve locally as [JSON:API](http://jsonapi.org/).

> ⚠️ **WARNING:** The app tries to process all Ember.js and Ember Data versions since 1.0 which takes high memory & time to complete.

```bash
# Clone the repository.
git clone https://github.com/ember-learn/ember-jsonapi-docs
cd ember-jsonapi-docs

# Install the dependencies.
yarn

# Set environment variables to get access to s3://api-docs.emberjs.com.
# Use Access Keys generated in step 3 in "Prerequisites".
export AWS_ACCESS_KEY_ID=xxxxxx
export AWS_SECRET_ACCESS_KEY=xxxxx

# Download YUIDoc docs and index files for all projects/releases from s3://api-docs.emberjs.com.
# Then, generate JSON:API-comlaint docs from the downloaded files.
yarn start --sync --max_old_space_size=8192

# At this point, you can also generate JSON:API-comlaint docs only for 
# a particular project/release.
yarn start --project ember --version 3.17.0
yarn start --project ember-data --version 3.17.0

# Run API locally.
yarn serve
```

> ℹ️ **NOTE:** If docs for a particular version are missing in `s3://api-docs.emberjs.com`, the tool downloads them from npm (e.g. https://unpkg.com/ember-source@3.17.0/docs/data.json) as a fallback.

## Overriding a specific version of YUIDoc file with a local copy (for core contributors).

To proceed, you need AWS Access Keys to publish to [api-docs.emberjs.com](http://api-docs.emberjs.com/) and all necessary environemnt variables set.

> ⚠️ **WARNING:** In its present form this should be used only when there aren't new docs out there that are yet to be processed. For example, if Ember 3.17 is released but isn't indexed yet you should wait for this app to finish processing it via the cron job on Heroku before you can proceed to modify any of the existing docs from your machine.

```bash
# Set environment variables.
export AWS_ACCESS_KEY_ID=xxxxxx
export AWS_SECRET_ACCESS_KEY=xxxxx

# Download YUIDoc docs and index files for all releases from s3://api-docs.emberjs.com.
# This is important so that we don't loose other versions of docs that 
# are already out there when the index files are generated.
yarn start --sync --max_old_space_size=8192

# Go to the folder and and replace a YUIDoc file that you want to be processed.
# Ensure that the file name is same as the one that's already there.
cd tmp/s3-docs/<VERSION_TO_REPLACE>

# Set an environment variable to enable publishing to s3://api-docs.emberjs.com.
export AWS_SHOULD_PUBLISH=yes

# Regenerate JSON:API-comlaint docs only for a particular project/release and 
# publish them to s3://api-docs.emberjs.com...
yarn start --project ember --version <VERSION_TO_REPLACE> --ignorePreviouslyIndexedDoc
yarn start --project ember-data --version <VERSION_TO_REPLACE> --ignorePreviouslyIndexedDoc

# OR
# Regenerate JSON:API-comlaint docs for ALL projects/releases regardless of indexed version and 
# publish them to s3://api-docs.emberjs.com.
yarn start --clean --max_old_space_size=8192
```

## Running from GitHub

```
git clone git@github.com:ember-learn/ember-api-docs-data.git
git clone git@github.com:emberjs/ember.js.git && cd ember.js && yarn install
git clone git@github.com:ember-learn/ember-jsonapi-docs.git && cd ember-jsonapi-docs.git && yarn install
yarn gen --project ember --version "3.24.0"
yarn start --project ember --version "3.24.0"
```

## Backing Up Docs

If you plan to run a major migration, back up all the content to a timestamped folder in the Amazon S3 bucket.

```bash
yarn backup
```

## FAQ

### Can I use API from the [ember-api-docs](https://github.com/ember-learn/ember-api-docs) app?

Yes, follow one of the quickstarts and then run the `ember-api-docs` application using the following commands.

```bash
# Clone the repository with the "ember-api-docs" app.
git clone https://github.com/ember-learn/ember-api-docs
cd ember-api-docs

# Install the dependencies.
yarn

# Run the application side by side with a locally running API.
yarn start:local
```
