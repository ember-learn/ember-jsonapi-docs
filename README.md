# Ember JSON API Docs [![Build Status](https://travis-ci.org/ember-learn/ember-jsonapi-docs.svg?branch=master)](https://travis-ci.org/ember-learn/ember-jsonapi-docs)

If you are looking for the app behind https://emberjs.com/api/, visit
[ember-api-docs](https://github.com/ember-learn/ember-api-docs) instead. This ember-jsonapi-docs
repository is internal tooling that is not required to run the ember-api-docs app locally.

ember-jsonapi-docs is for turning code comments in [ember.js](https://github.com/emberjs/ember.js) into
[json api](http://jsonapi.org/) compliant data for use in various applications seeking to use the Ember API.

The script pulls yuidoc build output from all Ember versions from Amazon S3, converts it to json api format and creates an archive. It can also be run to build jsonapi docs from a local copy of ember.js.

## Running the app

1.  Fork/Clone [ember-jsonapi-docs](https://github.com/ember-learn/ember-jsonapi-docs)
1.  Run `yarn` or `npm install` (Needs node 6+)
1.  Set up AWS access

    ```shell
    export AWS_ACCESS_KEY=xxxxxx
    export AWS_SECRET_KEY=xxxxx
    ```

    The app accesses builds.emberjs.com (an Amazon S3 bucket) in read-only mode, which is public. This requires any valid AWS credentials.

    You can get your credentials by logging into your [AWS console](https://console.aws.amazon.com) and navigating to "_My Security Credentials_" under your profile name. You can generate a new pair under the "_Access Keys (Access Key ID and Secret Access Key)_" section.

1.  To test your changes in the app run,
    `node index.js`
    Once complete, if no errors you should see a docs.tar file inside the `tmp` folder. The app tries to process all
    ember & ember-data versions since 1.0 which takes high memory & time to complete. If you intend it, then run `node --max_old_space_size=8192 index.js`.
    You are setting your node max heap space to 8GB, so make sure you have that much space available on your machine.

## To Generate docs for a specific project and/or version for development

You can do this by passing `--project ember/ember-data --version 2.11.1` as an argument to the index script. e.g., `yarn start -- --project ember --version 2.11.0`.
You need an additional flag `AWS_SHOULD_PUBLISH=true` for publishing the docs.

## To override a specific version of a doc with a different yuidoc from your machine (For core contributors)

- Read this section first!
  - We assume you have the keys to the kingdom before you start doing this (AWS keys to publish to api-docs.emberjs.com & all necessary env variables that need to be set) 😄
  - In its present form this should be used only when there aren't new docs out there that are yet to be processed. As in if ember 3.3 is released but isn't indexed yet you should wait for this app to finish processing it via the cron job we have on heroku before you can proceed to modify any of the existing docs from your machine.
- First run `yarn start` so that you have all the docs from s3 on your local. This is important so that we don't loose other versions of docs that are already out there when the index files are generated
- Then go to `./tmp/s3-docs/<the_version_you_want_to_replace>` and override the file there with the yuidoc file that you want to be processed. Ensure that the file name is same as the one that's already there.
- Then run `yarn start --project=ember-data --version=3.2.0 --ignorePreviouslyIndexedDoc`. Make sure you enter the entire version(including patch version).
- To run against all versions of ember and ember-data regardless of indexed version, run `node --max_old_space_size=8192 index.js --clean`

## Generating API Documentation and Testing API Docs Locally

These steps are only necessary if you are trying to run the ember-api-docs
app with documentation pulled from a local copy of ember.js.

1.  Clone the following 4 repositories into a single parent directory. Install dependencies for each app as described in their respective `README` files.
    - [ember.js](https://github.com/emberjs/ember.js)
    - [data (ember data)](https://github.com/emberjs/data)
    - [ember-jsonapi-docs](https://github.com/ember-learn/ember-jsonapi-docs)
    - [ember-api-docs](https://github.com/ember-learn/ember-api-docs)
1.  Set up the project according to the instructions above in `Running the app`.
1.  From the `ember-jsonapi-docs` directory, run `./generate-local.sh yui ember 2.18.0`. This command runs the Ember documentation build, generates jsonapi output, and copies it to the `ember-api-docs` directory. To build ember data documentation, run `./generate-local.sh yui ember-data 2.17.2`.
    - If your `rev-index/ember-X.X.X.json` file fails to generate, make sure you have all dependencies installed for the ember.js repo
    - If you are debugging failed builds, periodically clear out the contents of the `tmp` directory, and run the script again. Past failed runs can cause subsequent runs to fail in unexpected ways.\_
1.  Run the API app with the newly generated local data by running `API_HOST=http://localhost:4200 ember s` in the `ember-api-docs` directory.
