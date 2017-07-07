let rollup = require('rollup').rollup,
    babel = require('rollup-plugin-babel'),
    rollupIncludePaths = require('rollup-plugin-includepaths'),
    json = require('rollup-plugin-json'),
    // filesize = require('rollup-plugin-filesize'),
    nodeResolve = require('rollup-plugin-node-resolve'),
    commonjs = require('rollup-plugin-commonjs'),
    // builtins = require('rollup-plugin-node-builtins'),
    // globals = require('rollup-plugin-node-globals'),
    cache;

rollup({
        entry: './lib/index.js',
        cache: cache,
        plugins: [
            rollupIncludePaths({
                paths: ['./src', './node_modules']
            }),
            nodeResolve(),
            commonjs(),
            json(),
            babel()
        ]
    })
    .then(bundle => {
        cache = bundle;
        return bundle.write({
            dest: './dist/index.js',
            sourceMap: true,
            format: 'cjs'
        });
    })
    .catch(console.error);
