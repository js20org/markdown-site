const { build } = require('esbuild');

build({
    entryPoints: ['./src-test/index.ts'],
    bundle: true,
    platform: 'node',
    outfile: './dist-dev/dev.js',
    target: 'node16',
    minify: false,
    sourcemap: true,
}).catch(() => process.exit(1));
