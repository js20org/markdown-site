const { build } = require('esbuild');

build({
    entryPoints: ['./src/index.ts'],
    bundle: true,
    platform: 'node',
    outfile: './dist/bundle.js',
    target: 'node16',
    minify: true,
}).catch(() => process.exit(1));
