ember-jsonapi-docs is a script for turning ember API doc build output into jsonapi compliant data for use in various applications seeking to use the Ember API.
[![Build Status](https://travis-ci.org/ember-learn/ember-jsonapi-docs.svg?branch=master)](https://travis-ci.org/ember-learn/ember-jsonapi-docs)

The script pulls yuidoc build output from all Ember versions from Amazon S3, converts it to json-api, and pushes it to CouchDB.

# Setting up a local API Data Environment
Follow these steps to get this project generating Ember API data into a local pouch db environment.
You can use this environment for testing out the ember-api-docs app locally, as well as for development on this project.

1. Clone or Fork/Clone ember-jsonapi-docs from github: https://github.com/ember-learn/ember-jsonapi-docs

2. Install the latest release of CouchDB: http://couchdb.apache.org/

3. Once installed, visit http://localhost:5984/_utils.  From the top navigation section, Click "Create Database" and type in "docs".

4. Create a couchdb admin user.  Got to the section in the left nav called "Admin Party!", and supply a username and password.

5. Set the following environment variables:
   ```
   COUCH_URL=http://127.0.0.1:5984/docs
   COUCH_USERNAME=<your admin couchdb username>
   COUCH_PASSWORD=<your admin couchdb password>
   ```

6. Set up AWS access

   One way to do this is to set the following environment variables

    ```
    AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY
    ```

    These values can be for any valid AWS account. The process accesses builds.emberjs.com in read-only mode, which is public.

7. Set up cors for CouchDB

   An easy way to do this is to use the script at https://github.com/pouchdb/add-cors-to-couchdb

    ```
    npm install -g add-cors-to-couchdb
    add-cors-to-couchdb -u <your admin couchdb username> -p <your admin couchdb password>
    ```

8. Finally run `node --max_old_space_size=8192 index` from the root of th repo.

   This will take a long time if its your first time.
   You are setting your node max heap space to 8GB, so make sure you have that much space available on your machine.
   Once complete, if no errors you should see your doc databse populated with data from your couchdb admin ui.
   
