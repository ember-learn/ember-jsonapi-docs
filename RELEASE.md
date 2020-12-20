# Ember Release

When a new version of Ember is released, follow these instructions to update the API documentation.

1. Run the following script:
```bash
mkdir ember-releases
cd ember-releases
git clone https://github.com/ember-learn/ember-jsonapi-docs.git
git clone https://github.com/emberjs/ember.js.git
git clone https://github.com/emberjs/data.git
cd ember-jsonapi-docs
```
2. Go to the heroku instance, navigate to `Settings`, click `reveal config vars` and use the values seen there as values for the following variables in your local environment:
    1. `AWS_ACCESS_KEY`
    2. `AWS_ACCESS_KEY_ID`
    3. `AWS_SECRET_ACCESS_KEY`
    4. `AWS_SECRET_KEY`
    5. `AWS_SHOULD_PUBLISH`
4. Run `yarn run start --sync`
5. Wait and confirm there were no errors
6. Done!
