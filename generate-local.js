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
  .addOption(new Option('--skip-install', 'skip the installation of dependencies'))
  .addOption(
    new Option('-p, --project <project>', 'the project that you want to run this for')
      .choices(['ember', 'ember-data'])
      .makeOptionMandatory(),
  )
  .requiredOption('-v, --version <version>', 'project version', semverVersion);

program.parse();

const options = program.opts();

const { project, version, skipInstall } = options;

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
  await commandExists('pnpm');
} catch (e) {
  exit(chalk.red('We need pnpm installed globally for this script to work'));
}

let emberProjectPath = path.join('../', 'ember.js');
let emberDataProjectPath = path.join('../', 'data');

let checkIfProjectDirExists = dirPath => {
  if (!existsSync(dirPath)) {
    exit(chalk.yellow(`Please checkout the ${project} project at ${dirPath}`));
  }
};

let buildDocs = async projDirPath => {
  checkIfProjectDirExists(projDirPath);

  if (!skipInstall) {
    if (project === 'ember') {
      await runCmd('corepack', projDirPath, ['pnpm', 'install']);
    } else {
      await runCmd('corepack', projDirPath, ['pnpm', 'install']);
    }
  }

  await runCmd(
    project === 'ember' ? 'corepack pnpm run docs' : 'corepack pnpm run build:docs',
    projDirPath,
  );

  let destination = `${docsPath}/s3-docs/v${version}/${project}-docs.json`;
  ensureFileSync(destination);
  const projYuiDocFile = destination;
  removeSync(projYuiDocFile);
  removeSync(`${docsPath}/json-docs/${project}/${version}`);

  const yuiDocFile = path.join(
    projDirPath,
    project === 'ember' ? 'docs/data.json' : 'packages/-ember-data/dist/docs/data.json',
  );
  copyFileSync(yuiDocFile, projYuiDocFile);
};

let dirMap = {
  ember: emberProjectPath,
  'ember-data': emberDataProjectPath,
};

await buildDocs(dirMap[project]);

await execa('pnpm', ['run', 'start', '--projects', project, '--version', version], {
  stdio: 'inherit',
});
