# Ember JSON API Docs [![Build Status](https://travis-ci.org/ember-learn/ember-jsonapi-docs.svg?branch=master)](https://travis-ci.org/ember-learn/ember-jsonapi-docs)

This app is for turning ember API doc build output into [json api](http://jsonapi.org/) compliant data for use in various applications seeking to use the Ember API.

The script pulls yuidoc build output from all Ember versions from Amazon S3, converts it to json api format and pushes it to CouchDB.
You can setup a CouchDB instance either [locally](#setting-up-a-local-couchdb-instance) or [on cloundant](#setting-up-a-couchdb-on-cloudant) for testing out changes to this app.


## Setting up a local CouchDB instance

1. Install the latest release of [CouchDB](http://couchdb.apache.org/).
1. Once installed, visit the [CouchDB UI](http://localhost:5984/_utils). From the top navigation section, Click "_Create Database_" and type in "*ember-api-docs*".
1. Create a CouchDB admin user.  Got to the section in the left nav called "_Admin Party!_", and supply a username and password.
1. Set up CORS for CouchDB
   An easy way to do this is to use the script at https://github.com/pouchdb/add-cors-to-couchdb
   
    ```shell
    npm install -g add-cors-to-couchdb
    add-cors-to-couchdb -u <your admin couchdb username> -p <your admin couchdb password>
    ```


## Setting up a CouchDB on cloudant

1. A [cloudant](https://cloudant.com/) account is neccessary before proceeding with the following steps.
1. Create a new Database and give it the name "*ember-api-docs*".
1. Goto the "_Permissions_" tab in the nav.
1. Click on "_Generate API Key_", save the credentials showed on the UI as we'll be using this in the next section as the CouchDB credentials.
1. Click on the _"_writer"_ checkbox for the API user so that it can push docs to cloudant.
1. Navigate to your account settings & in the "_CORS_" tab ensure that its enabled for all domains. 


## Running the app

1. Fork/Clone [ember-jsonapi-docs](https://github.com/ember-learn/ember-jsonapi-docs)
1. Run `npm install` or `yarn`
1. Set the following environment variables:

   ```shell
   export COUCH_URL=http://localhost:5984/ember-api-docs # or COUCH_URL=https://user-name.cloudant.com/ember-api-docs
   export COUCH_USERNAME=<your couchdb username>
   export COUCH_PASSWORD=<your couchdb password>
   ```
1. Set up AWS access
    ```shell
    export AWS_ACCESS_KEY_ID=xxxxxx
    export AWS_SECRET_ACCESS_KEY=xxxxx
    ```
    The app accesses builds.emberjs.com (an Amazon S3 bucket) in read-only mode, which is public. This requires any valid AWS credentials.

    You can get your credentials by logging into your [AWS console](https://console.aws.amazon.com) and navigating to "_My Security Credentials_" under your profile name. You can generate a new pair under the "_Access Keys (Access Key ID and Secret Access Key)_" section.
1. To test your changes in the app run,
   ```node index.js 2.11```
   This will run the app only for the specified version of the docs. Once complete, if no errors you should see your doc database 
   populated with data from your CouchDB admin ui. When no version is passed, the app will try to process all 
   ember versions since 1.0 which takes high memory & time to complete. If you intend it, then run `node --max_old_space_size=8192 index.js`.
   You are setting your node max heap space to 8GB, so make sure you have that much space available on your machine.


## Setting up a new production instance

1. Follow the steps from [setting up a CouchDB on cloudant section](#setting-up-a-couchdb-on-cloudant)
1. Run `npm start` or `yarn start` from your local. This is required since travis kills a build if [a task crosses 50mins](https://docs.travis-ci.com/user/customizing-the-build#Build-Timeouts), & the first run will take 50+ mins to complete.
1. On Travis UI [enable cron jobs](https://docs.travis-ci.com/user/cron-jobs/) for daily/hourly basis so that newer docs get indexed incrementally.
