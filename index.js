#!/usr/bin/env node

import { apiDocsProcessor } from './main.js';
import { program, Option, InvalidArgumentError } from 'commander';
import chalk from 'chalk';

function semverVersion(value) {
  if (!/^\d+\.\d+\.\d+$/.test(value)) {
    throw new InvalidArgumentError('Not a correctly defined semver version i.e. major.minor.patch');
  }
  return value;
}

program
  .addOption(
    new Option('-p, --projects <project...>', 'the projects that you want to run this for')
      .choices(['ember', 'ember-data', 'ember-cli'])
      .makeOptionMandatory(),
  )
  .addOption(
    new Option('-v, --version <version>', 'project version', semverVersion).conflicts('all'),
  )
  .addOption(
    new Option('-a, --all', 'process all versions (this will take a long time)').conflicts(
      'version',
    ),
  )
  .option('-c, --clean', 'clean (not sure what this does)');

program.parse();

const options = program.opts();

const { projects, version, clean, all } = options;

if (!version && !all) {
  console.log(chalk.red('You need to specify a --version or pass --all to this program'));
  process.exit(1);
}

apiDocsProcessor(projects, version, clean);
