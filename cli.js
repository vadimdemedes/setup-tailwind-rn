#!/usr/bin/env node
import * as fs from 'fs-extra';
import meow from 'meow';
import Listr from 'listr';
import {execa} from 'execa';
import hasYarn from 'has-yarn';
import jsonFile from 'json-file-plus';
import indentString from 'indent-string';
import chalk from 'chalk';
import figures from 'figures';

meow(
	`
	Usage
	  $ setup-tailwind-rn
`,
	{
		importMeta: import.meta
	}
);

const useYarn = hasYarn();

const tasks = new Listr([
	{
		title: 'Install dependencies',
		task: async () => {
			if (useYarn) {
				await execa('yarn', ['add', 'tailwind-rn']);
				await execa('yarn', [
					'add',
					'--dev',
					'tailwindcss',
					'postcss',
					'concurrently'
				]);
				return;
			}

			await execa('npm', ['install', 'tailwind-rn']);
			await execa('npm', [
				'install',
				'--save-dev',
				'tailwindcss',
				'postcss',
				'concurrently'
			]);
		}
	},
	{
		title: 'Create Tailwind config',
		task: async () => {
			await execa(useYarn ? 'yarn' : 'npx', ['tailwindcss', 'init']);
			await fs.default.writeFile('input.css', '@tailwind utilities;\n');
			await fs.default.writeFile('tailwind.css', '\n');
			await fs.default.writeFile('tailwind.json', '{}\n');
		}
	},
	{
		title: 'Add scripts',
		task: async () => {
			const packageJson = await jsonFile('package.json');

			packageJson.set({
				scripts: {
					'build:tailwind':
						'tailwindcss --input input.css --output tailwind.css --no-autoprefixer && tailwind-rn',
					'dev:tailwind':
						'concurrently "tailwindcss --input input.css --output tailwind.css --no-autoprefixer --watch" "tailwind-rn --watch"'
				}
			});

			await packageJson.save();
		}
	}
]);

const summary = [
	`${chalk.cyan(figures.star)} Summary`,
	'',
	'New scripts in package.json:',
	'',
	` ${chalk.bold('build:tailwind')} ${chalk.dim(
		'-'
	)} Build CSS file and transform it for use with tailwind-rn`,
	` ${chalk.bold('dev:tailwind')} ${chalk.dim(
		'-'
	)} Watch mode for the command above`,
	'',
	'New files:',
	'',
	` ${chalk.bold('tailwind.config.js')} ${chalk.dim(
		'-'
	)} Tailwind configuration`,
	` ${chalk.bold('input.css')} ${chalk.dim(
		'-'
	)} Entrypoint for Tailwind compiler`,
	` ${chalk.bold('tailwind.css')} ${chalk.dim(
		'-'
	)} Generated CSS by Tailwind compiler`,
	` ${chalk.bold('tailwind.json')} ${chalk.dim(
		'-'
	)} Generated CSS converted into JSON for \`tailwind-rn\``,
	'',
	`${chalk.cyan(figures.arrowDown)} What's next?`,
	'',
	`1. Run ${chalk.bold('tailwind-rn')} in development mode:`,
	'',
	` ${chalk.dim('$')} ${useYarn ? 'yarn' : 'npm run'} dev:tailwind`,
	'',
	`2. Import ${chalk.bold('TailwindProvider')} and ${chalk.bold(
		'tailwind.json'
	)} in the root of your app`,
	'',
	` ${chalk.red('import')} {${chalk.green('TailwindProvider')}} ${chalk.red(
		'from'
	)} ${chalk.yellow("'tailwind-rn'")};`,
	` ${chalk.red('import')} ${chalk.green('utilities')} ${chalk.red(
		'from'
	)} ${chalk.yellow("'./tailwind.json'")};`,
	'',
	`3. Wrap the root of your app into ${chalk.bold('TailwindProvider')}:`,
	'',
	` ${chalk.red('<TailwindProvider')} ${chalk.green(
		'utilities'
	)}={${chalk.green('utilities')}}${chalk.red('>')}`,
	`   ${chalk.red('<MyComponent/>')}`,
	` ${chalk.red('</TailwindProvider>')}`,
	'',
	`4. Use Tailwind`,
	'',
	` ${chalk.red('import')} {${chalk.green('useTailwind')}} ${chalk.red(
		'from'
	)} ${chalk.yellow("'tailwind-rn'")};`,
	'',
	` ${chalk.red('const')} ${chalk.green('MyComponent')} ${chalk.red(
		'='
	)} () ${chalk.red('=>')} {`,
	`   ${chalk.red('const')} ${chalk.green('tailwind')} ${chalk.red(
		'='
	)} ${chalk.green('useTailwind')}();`,
	'',
	`   ${chalk.red('return <Text')} ${chalk.green('style')}={${chalk.green(
		'tailwind'
	)}(${chalk.yellow("'text-blue-600'")})}${chalk.red(
		'>'
	)}Hello world${chalk.red('</Text>')};`,
	' };'
].join('\n');

const run = async () => {
	console.log('');
	await tasks.run();
	console.log('');
	console.log(indentString(summary, 2));
	console.log('');
};

run();
