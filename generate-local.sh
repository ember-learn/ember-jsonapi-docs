cd ../ember.js
echo "🏃 💨  Running ember docs build 🏃 💨"
npm run docs
echo "🚚 💨  Copying docs output to ember-jsonapi-docs for version $1... 🚚 💨 "
rm -rf ../ember-jsonapi-docs/tmp/s3-docs/v$1
rm -rf ../ember-jsonapi-docs/tmp/json-docs/ember/$1
mkdir ../ember-jsonapi-docs/tmp/s3-docs/v$1
cp -fv docs/data.json ../ember-jsonapi-docs/tmp/s3-docs/v$1/ember-docs.json
cd ../ember-jsonapi-docs
echo "🏃 💨  Running ember-jsonapi-docs for version $1 🏃 💨 "
yarn start -- --project ember --version $1
echo "🚚 💨  Copying rev-index json file to ember-api-docs app... 🚚 💨 "
rm -rf ../ember-api-docs/public/rev-index ../ember-api-docs/public/json-docs
mkdir ../ember-api-docs/public/rev-index
cp -v tmp/rev-index/ember.json ../ember-api-docs/public/rev-index/
cp -fv tmp/rev-index/ember-$1.json ../ember-api-docs/public/rev-index/
echo "🚚 💨  Copying json-docs structure to ember-api-docs app... 🚚 💨 "
rm -rf ../ember-api-docs/public/json-docs
mkdir ../ember-api-docs/public/json-docs
mkdir ../ember-api-docs/public/json-docs/ember
mkdir ../ember-api-docs/public/json-docs/ember/$1
cp -rf tmp/json-docs/ember/$1/ ../ember-api-docs/public/json-docs/ember/$1/
echo "🎉🎉🎉 DONE 🎉🎉🎉"
