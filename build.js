const fs = require('fs');
const { rimrafSync } = require('rimraf');
const revision = require('child_process');

const filename = 'provins.js';

rimrafSync(`./dist/${filename}`);
require('@vercel/ncc')(`${__dirname}/src/index.ts`, {
    // provide a custom cache path or disable caching
    cache: "./custom/cache/path" | false,
    // externals to leave as requires of the build
    // externals: ["express", "ioredis", "@prisma/client"],
    externals: [],
    // directory outside of which never to emit assets
    filterAssetBase: process.cwd(), // default
    minify: true, // default
    sourceMap: false, // default
    assetBuilds: true, // default
    sourceMapBasePrefix: '../', // default treats sources as output-relative
    // when outputting a sourcemap, automatically include
    // source-map-support in the output file (increases output by 32kB).
    sourceMapRegister: true, // default
    watch: false, // default
    license: '', // default does not generate a license file
    target: 'es2016', // default
    v8cache: false, // default
    quiet: false, // default
    debugLog: false // default
}).then(({ code, map, assets }) => {
    const dirPath = './dist';

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(`${dirPath}/${filename}`, code);
    for (const filename in assets) {
        const p = filename.split('/');
        const buffer = assets[filename].source;
        let f;

        if (p.length > 1) {
            f = `${dirPath}/${p.slice(0, p.length - 1).join('/')}`;
            if (!fs.existsSync(f)) {
                fs.mkdirSync(f, { recursive: true });
            }
        }

        else {
            f = dirPath;
        }

        fs.writeFileSync(`${f}/${p[p.length - 1]}`, buffer);
    }
});