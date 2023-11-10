#!/usr/bin/env node

import chalk from 'chalk';
import commandExists from 'command-exists';
import execa from 'execa';
import fsExtra from 'fs-extra';
import path from 'path';

const { copyFileSync, ensureFileSync, existsSync, removeSync } = fsExtra;

const docsPath = '../ember-api-docs-data';

import { program, Option, InvalidArgumentError } from 'commander';

function exit() {
  console.log(...arguments);
  process.exit(1);
}

function semverVersion(value) {
  if (!/^\d+\.\d+\.\d+$/.test(value)) {
    throw new InvalidArgumentError('Not a correctly defined semver version i.e. major.minor.patch');
  }
  return value;
}

program
  .addOption(
    new Option('-p, --project <project>', 'the project that you want to run this for')
      .choices(['ember', 'ember-data', 'ember-cli'])
      .makeOptionMandatory(),
  )
  .requiredOption('-v, --version <version>', 'project version', semverVersion);

program.parse();

const options = program.opts();

const { project, version } = options;

async function runCmd(cmd, path, args = []) {
  console.log(chalk.underline(`Running '${chalk.green(cmd)}' in ${path}`));
  const executedCmd = await execa(cmd, args, { cwd: path, shell: true, stdio: 'inherit' });

  if (executedCmd.failed) {
    console.error(executedCmd.stdout);
    console.error(executedCmd.stderr);
    process.exit(1);
  }

  console.log(executedCmd.stdout + '\n');
}

try {
  await commandExists('yarn');
} catch (e) {
  exit(chalk.red('We need yarn installed globally for this script to work'));
}

let emberProjectPath = path.join('../', 'ember.js');
let emberDataProjectPath = path.join('../', 'data');
let emberCliProjectPath = path.join('../', 'ember-cli');

let checkIfProjectDirExists = dirPath => {
  if (!existsSync(dirPath)) {
    exit(chalk.yellow(`Please checkout the ${project} project at ${dirPath}`));
  }
};

let buildDocs = async projDirPath => {
  checkIfProjectDirExists(projDirPath);

  if (project === 'ember-data') {
    await runCmd('corepack', projDirPath, ['pnpm', 'install']);
  } else {
    await runCmd('volta', projDirPath, ['run', 'yarn']);
  }

  await runCmd(
    project === 'ember-data' ? 'corepack pnpm run build:docs' : 'volta run yarn docs',
    projDirPath,
  );

  let destination = `${docsPath}/s3-docs/v${version}/${project}-docs.json`;
  ensureFileSync(destination);
  const projYuiDocFile = destination;
  removeSync(projYuiDocFile);
  removeSync(`${docsPath}/json-docs/${project}/${version}`);

  const paths = {
    ember: 'docs/data.json',
    'ember-cli': 'docs/build/data.json',
    'ember-data': 'packages/-ember-data/dist/docs/data.json',
  };

  const yuiDocFile = path.join(projDirPath, paths[project]);
  copyFileSync(yuiDocFile, projYuiDocFile);
};

let dirMap = {
  ember: emberProjectPath,
  'ember-data': emberDataProjectPath,
  'ember-cli': emberCliProjectPath,
};

await buildDocs(dirMap[project]);

await execa('volta', ['run', 'yarn', 'start', '--projects', project, '--version', version], {
  stdio: 'inherit',
});
