import fs from 'fs';
import chalk from 'chalk';
import axios from 'axios';
import { program } from 'commander';
import { parse } from 'node-html-parser';
import readlineSync from 'readline-sync';
import app from '../package.json';

const REFORGER_WORKSHOP_URL = 'https://reforger.armaplatform.com/workshop';
const REFORGER_WORKSHOP_NEXT_ID = '__NEXT_DATA__';
type Mod = { modId: string, name: string, version?: string };

program
    .name(app.name)
    .description(app.description)
    .version(app.version)
    .argument('<path>', 'reforger server config json file path')
    .option('-y, --yes', 'don\'t ask when modifying json', false)
    .action(async path => {
        const yes = program.opts().yes;

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
            if (Array.isArray(json.game.mods)) {
                mods = [...json.game.mods];
            }
    
            else {
                throw new Error('Invalid Json');
            }
        }
    
        catch (fileParseError) {
            console.error(chalk.red(fileParseError));
            process.exit(0);
        }
    
        console.log(`There are ${chalk.green(mods.length)} mods.`);
        const allgoodMod: Mod[] = [];
        const outdatedMod: Mod[] = [];
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
                        outdatedMod.push(mod);
                        updatedMod.push({ ...mod, version: asset.currentVersionNumber });
                        console.log(`🔔 [${mod.modId}|${mod.name}]: Outdated`);
                    }
    
                    else {
                        console.log(`✅ [${mod.modId}|${mod.name}]: No changes`);
                        allgoodMod.push(mod);
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
    
        console.log();
        console.log('✨ Tasks completed.');
        console.log(`  * ✅ Good Standing: ${mods.length - outdatedMod.length - deletedMod.length}`);
    
        console.log(`  * 🔔 Outdated: ${outdatedMod.length}`);
        outdatedMod.forEach((v, i) => {
            console.log(`    - ${v.modId}, ${chalk.yellow(v.version)} ➜ ${chalk.green(updatedMod[i].version)} ${v.name}`);
        });
    
        console.log(`  * ❌ Unavailable: ${deletedMod.length}`);
        deletedMod.forEach(x => {
            console.log(`    - ${x.modId}, ${x.name}`);
        });
    
        let flagUpdate = false, flagRemove = false;
        console.log()
        if (updatedMod.length > 0) {
            if (yes) {
                flagUpdate = true;
            }
    
            if (!yes && readlineSync.keyInYN(`Do you want to ${chalk.yellow('renew')} the ${chalk.yellow(updatedMod.length)} outdated mods?`)) {
                flagUpdate = true;
            }
        }
    
        if (deletedMod.length > 0) {
            if (yes) {
                flagRemove = true;
            }
    
            if (!yes && readlineSync.keyInYN(`Do you want to ${chalk.red('remove')} the ${chalk.red(deletedMod.length)} unavailable mods?`)) {
                flagRemove = true;   
            }
        }
    
        if (!(flagUpdate || flagRemove)) {
            console.log('😅 There are nothing to do.');
            process.exit(0);
        }
    
        const entireMods = [...allgoodMod];
        if (flagUpdate) entireMods.push(...updatedMod);
        else            entireMods.push(...outdatedMod);
    
        if (!flagRemove) entireMods.push(...deletedMod);
    
        const config = JSON.parse(JSON.stringify(json));
        config.game.mods = entireMods.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
    
        try {
            fs.writeFileSync(`${path}.bak`, JSON.stringify(json, null, 4));
            fs.writeFileSync(path, JSON.stringify(config, null, 4));
            console.log(chalk.green('👍 Your configs have been saved, Goodbye!'));
        }
    
        catch (fileWriteError) {
            console.error(fileWriteError);
            process.exit(0);
        }
    });

program.parse();