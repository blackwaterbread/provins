import fs from 'fs';
import chalk from 'chalk';
import axios from 'axios';
import { program } from 'commander';
import { parse } from 'node-html-parser';
import app from '../package.json';

const REFORGER_WORKSHOP_URL = 'https://reforger.armaplatform.com/workshop';
const REFORGER_WORKSHOP_NEXT_ID = '__NEXT_DATA__';
type Mod = { modId: string, name: string, version?: string };

program
    .name(app.name)
    .description(app.description)
    .version(app.version)
    .option('-t, --target <path>', 'json file path')
    // .option('-v, --verbose', 'print detailed information')

async function main() {
    program.parse();
    // const verbose = program.opts().verbose;
    const path = program.opts().target ?? './config.json';

    let json;
    try {
        json = JSON.parse(fs.readFileSync(path).toString());
    }

    catch (fileReadError) {
        console.error(chalk.red(fileReadError));
        console.log(chalk.yellow('Try specifying the path to the JSON file with the -t option.'));
        console.log(chalk.yellow('ex) node hermes.js -t "./server.json"'));
        process.exit(0);
    }

    let mods = [];
    try {
        if (Array.isArray(json)) {
            mods = json;
        }

        else {
            if (Array.isArray(json.game.mods)) {
                mods = json.game.mods;
            }

            else {
                throw new Error('Invalid Json');
            }
        }
    }

    catch (fileParseError) {
        console.error(chalk.red(fileParseError));
        process.exit(0);
    }

    console.log(`There are ${chalk.green(mods.length)} mods.`);
    const updatedMod: Mod[] = [];
    const deletedMod: Mod[] = [];

    for (const [i, v] of Object.entries(mods)) {
        const mod = v as Mod;
        if (!mod.modId || !mod.name) {
            console.error(chalk.red(`Invalid Mod Json at ${i}`));
            process.exit(0);
        }

        else {
            try {
                const req = await axios.get(`${REFORGER_WORKSHOP_URL}/${mod.modId}`);
                const dom = parse(req.data);
                const nextRes = dom.getElementById(REFORGER_WORKSHOP_NEXT_ID)?.childNodes[0].innerText;

                if (!nextRes) {
                    throw new Error(`Cannot get workshop data: [${mod.modId}, ${mod.name}]`);
                }

                const props = JSON.parse(nextRes);
                /*
                if (!props.props.pageProps.asset || !props.props.pageProps.pathId) {
                    deletedMod.push(mod);
                }
                */

                const { asset } = props.props.pageProps;
                if (mod.version && (mod.version !== asset.currentVersionNumber)) {
                    const uMod = mod;
                    uMod.version = `${mod.version},${asset.currentVersionNumber}`;
                    updatedMod.push(mod);
                    console.log(`🔔 [${mod.modId}|${mod.name}]: Outdated`);
                }

                else {
                    console.log(`✅ [${mod.modId}|${mod.name}]: No changes`);
                }
            }

            catch (axiosError) {
                const statusCode = (axiosError as any)?.response.status;

                if (statusCode || statusCode === 404) {
                    deletedMod.push(mod);
                    console.log(`❌ [${mod.modId}|${mod.name}]: Unavailable`);
                }

                else {
                    console.error(chalk.red(`Something was wrong with processing this mod: ${i}, ${mod.modId}, ${mod.name}`));
                    process.exit(0);
                }
            }
        }
    }

    console.log()
    console.log('Tasks completed.')
    console.log(`✅ Good Standing: ${mods.length - updatedMod.length - deletedMod.length}`)
    console.log(`🔔 Outdated: ${updatedMod.length}`)
    for (const mod of updatedMod) {
        const ver = mod.version!.split(',');
        console.log(`    - ${mod.modId}, ${chalk.yellow(ver[0])} ➜ ${chalk.green(ver[1])} ${mod.name}`);
    }

    console.log(`❌ Unavailable: ${deletedMod.length}`)
    for (const mod of deletedMod) {
        console.log(`    - ${mod.modId}, ${mod.name}`);
    }
}

main().catch(e => console.error(e));