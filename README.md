# Ember JSON API Docs [![Build Status](https://travis-ci.org/ember-learn/ember-jsonapi-docs.svg?branch=master)](https://travis-ci.org/ember-learn/ember-jsonapi-docs)

This tool gets the code comments from `ember.js` and `ember-data` libraries,
turns them into JSON files, and then turns those JSON files into a
[JSON:API](http://jsonapi.org/) format.

The files this tool creates are used to power 
[api.emberjs.com](https://api.emberjs.com).


> ℹ️ **NOTE:** If you are looking for the front end app behind https://api.emberjs.com/, visit [ember-api-docs](https://github.com/ember-learn/ember-api-docs) instead.

## Prerequisites

- the latest [Node.js](https://nodejs.org/) LTS
- [yarn v1](https://yarnpkg.com/)

Clone all of the following repositories into the same directory,
and `yarn install` in each one:

- This repository, `ember-jsonapi-docs`
- [ember-api-docs-data](https://github.com/ember-learn/ember-api-docs-data)
- [ember.js](https://github.com/emberjs/ember.js)
- [ember-data](https://github.com/emberjs/data/)

## Generate docs

Decide which version and project you want to build docs for.
Then, in `ember.js` and/or `ember-data` repositories, check out the version
tags you want to generate docs for. For example:

```sh
git checkout v3.20.0
```

Generate the JSON docs for `ember` and/or `ember-data`. This will add new JSON
files into the `s3-docs` directory of `ember-api-docs-data`:

```sh
yarn gen --project ember --version "3.20.0"
yarn gen --project ember-data --version "3.20.0"
```

Now, run this command to parse the `s3-docs` files into JSON:API docs for 
`ember` and/or `ember-data`.
This will add new files into `json-docs` and `rev-index` in `ember-api-docs-data`.

```
yarn start --project ember --version "3.20.0"
yarn start --project ember-data --version "3.20.0"
```

> ℹ️ **NOTE:** `--version` should match the one in the `package.json` of a target Ember project. If `package.json` uses a release name (e.g. `beta` or `canary`), omit it and use only numbers. For example, if the `package.json` says `3.19.0-beta.2`, use `3.19.0`.

> ✅ **TIP:** If you are debugging failed builds, periodically discard the changes
made to `ember-api-docs-data`, since changes are made in-place.

## View the generated docs in a web app

From the [ember-api-docs-data](https://github.com/ember-learn/ember-api-docs-data)
repository, start a server for the JSON files:

```
yarn serve
```

Clone the [ember-api-docs](https://github.com/ember-learn/ember-api-docs)
repository, install dependencies, and start the front end in "local" mode:

```
git clone https://github.com/ember-learn/ember-api-docs
yarn install
yarn start:local
```

Visit the app in your browser at [http://localhost:4200](http://localhost:4200)
