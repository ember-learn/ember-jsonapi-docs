# How to Generate API Documentation Locally

These steps are only necessary if you are trying to run the ember-api-docs
app with documentation pulled from a local copy of ember.js and/or ember-data.


## Initial Setup

1. Clone the following 4 repositories into a single parent directory. Install dependencies for each app as described in their respective `README` files.
   - [ember.js](https://github.com/emberjs/ember.js)
   - [data (ember-data)](https://github.com/emberjs/data)
   - [ember-jsonapi-docs](https://github.com/ember-learn/ember-jsonapi-docs)
   - [ember-api-docs](https://github.com/ember-learn/ember-api-docs)
1. Configure this project (ember-api-docs) according to the instructions in the README section in [`Running the app`](README.md#running-the-app).
1. From the `ember-jsonapi-docs` directory, run `yarn gen --project ember --version 2.18.0`.
    - This command runs the Ember documentation build, generates jsonapi output, copies it to the `ember-api-docs` directory. To build ember-data documentation, run `yarn gen --project ember-data --version 2.18.0`.
1. Run `yarn server` in this app. This serves a local API that `ember-api-docs` consumes.
1. Run `yarn start:local` in the `ember-api-docs` directory.

## Regular Workflow

1. Generate the documentation for the given project you need
    - `yarn gen --project ember --version 3.14.0`.
1. Run `yarn server` in this app.
1. Run `yarn start:local` in the `ember-api-docs` directory.

## Troubleshooting

You may encounter failed builds while running `yarn gen` as described above.
If you are debugging failed builds, periodically clear out the contents of the `tmp` directory, and run the script again. Past failed runs can cause subsequent runs to fail in unexpected ways.
