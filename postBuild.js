import * as fs from 'fs-extra';
import { exec } from "child_process";



const screensaver = process.argv[2] || 'twitch-sentiment'; // config.name.toLowerCase().replace(/ /g, '-');
const platform = process.argv[3] || 'chrome';
const buildDir = `test/${platform}/${screensaver}`;
const artifactDir = `artifacts/${platform}/`;


async function postBuild() {
    console.log('moving files');
    try {
        console.log('removing build dir', buildDir);
        await fs.remove(`./${buildDir}`);
        console.log('copying react build');
        await fs.copy(`./build`, `./${buildDir}/`);
        console.log('copying screensaver assets');
        await fs.copy(`./assets/`, `./${buildDir}/`);
        await fs.copy(`./assets/icon/`, `./${buildDir}/`);
        // console.log('copying manifest');
        // await fs.copy(`./screensavers/${screensaver}/manifest.${platform}.json`, `./${buildDir}/manifest.json`);
        console.log('Copying browser polyfill');
        await fs.copy('./node_modules/webextension-polyfill/dist/browser-polyfill.js', `./${buildDir}/browser-polyfill.js`);
        console.log('Copying extension scripts');
        await fs.copy('./src/app', `./${buildDir}/app`);
        // console.log('copying config');
        // await fs.copy(`./screensavers/${screensaver}/config.js`, `./${buildDir}/app/config.js`);
        // console.log('Copying i18 folder');
        // await fs.copy('./src/i18', `./${buildDir}/i18`);
        // console.log('Copying _locales folder');
        // await fs.copy('_locales', `./${buildDir}/_locales`);
        console.log('generating artifact');
        const command = `npx web-ext build -s ${buildDir} -a ${artifactDir} -o`;
        await run(command);
    } catch(err) {
        console.error('Error in moving files', err);
    }
}

function run(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`stderr: ${stderr}`);
                return;
            }
            resolve(`stdout: ${stdout}`);
        });
    })
}

postBuild();
