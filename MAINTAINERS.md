# Maintainers

In order to release a new version of the API docs manually, follow these steps.

1. Make sure you have the latest version of this repository, `ember.js`,
`ember-data`, `ember-api-docs-data`, and `ember-api-docs`.
2. Make sure you have a clean working directory in each repository,
i.e. `git status`
3. Go through the steps in the README to generate the docs and preview
them in the web app
4. If everything looks good, commit the changes to `ember-api-docs-data`
and open a pull request to that repository.

When the pull request is merged in `ember-api-docs-data`, the files
will be synced automatically to S3.
Either you can wait for them to show up in the deployed website,
or you can clear the Fastly cache to force them to show up faster.
