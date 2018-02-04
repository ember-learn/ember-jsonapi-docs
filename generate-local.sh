#!/usr/bin/env bash

PROJECT=${2:-ember}
VERSION=${3:-2.16.0}
COMMAND=${1:-json}

if [ $COMMAND == 'yui' ] && [ ${2} == 'ember' ]
then
  cd ../ember.js
  echo "🏃 💨  Running ember docs build 🏃 💨"
  npm run docs
  echo "🚚 💨  Copying docs output to ember-jsonapi-docs for version $1... 🚚 💨 "
  rm -rf ../ember-jsonapi-docs/tmp/s3-docs/v$VERSION/$PROJECT-docs.json
  rm -rf ../ember-jsonapi-docs/tmp/json-docs/$PROJECT/$VERSION
  mkdir -p ../ember-jsonapi-docs/tmp
  mkdir -p ../ember-jsonapi-docs/tmp/s3-docs
  mkdir -p ../ember-jsonapi-docs/tmp/s3-docs/v$VERSION
  cp -fv docs/data.json ../ember-jsonapi-docs/tmp/s3-docs/v$VERSION/ember-docs.json
elif [ "$COMMAND" == 'yui' ] && [ "${2}" == 'ember-data' ]
then
  cd ../data
  echo "🏃 💨 Running ember data docs build 🏃 💨"
  npm run production
  echo "🚚 💨 Copying data docs output to ember-jsonapi-docs for version $1... 🚚 💨 "
  rm -rf ../ember-jsonapi-docs/tmp/s3-docs/v$VERSION/$PROJECT-docs.json
  rm -rf ../ember-jsonapi-docs/tmp/json-docs/$PROJECT/$VERSION
  mkdir -p ../ember-jsonapi-docs/tmp
  mkdir -p ../ember-jsonapi-docs/tmp/s3-docs
  mkdir -p ../ember-jsonapi-docs/tmp/s3-docs/v$VERSION
  cp -fv dist/docs/data.json ../ember-jsonapi-docs/tmp/s3-docs/v$VERSION/$PROJECT-docs.json
fi

cd ../ember-jsonapi-docs
echo "🏃 💨  Running ember-jsonapi-docs for version $VERSION 🏃 💨 "
yarn start -- --project $PROJECT --version $VERSION
echo "🚚 💨  Copying rev-index json file to ember-api-docs app... 🚚 💨 "
rm -f ../ember-api-docs/public/rev-index/$PROJECT-$VERSION.json
mkdir -p ../ember-api-docs/public/rev-index
cp -v tmp/rev-index/$PROJECT.json ../ember-api-docs/public/rev-index/
cp -fv tmp/rev-index/$PROJECT-$VERSION.json ../ember-api-docs/public/rev-index/
echo "🚚 💨  Copying json-docs structure to ember-api-docs app... 🚚 💨 "
rm -rf ../ember-api-docs/public/json-docs/$PROJECT/$VERSION
mkdir -p ../ember-api-docs/public/json-docs/
mkdir -p ../ember-api-docs/public/json-docs/$PROJECT
mkdir -p ../ember-api-docs/public/json-docs/$PROJECT/$VERSION
cp -rf tmp/json-docs/$PROJECT/$VERSION/* ../ember-api-docs/public/json-docs/$PROJECT/$VERSION/
echo "🎉🎉🎉 DONE 🎉🎉🎉"
