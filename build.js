let rollup = require('rollup').rollup,
    babel = require('rollup-plugin-babel'),
    // rollupIncludePaths = require('rollup-plugin-includepaths'),
    // nodeResolve = require('rollup-plugin-node-resolve'),
    json = require('rollup-plugin-json'),
    commonjs = require('rollup-plugin-commonjs'),
    cache;

rollup({
        entry: './lib/index.js',
        cache: cache,
        plugins: [
            // rollupIncludePaths({
            //     paths: ['./lib', './node_modules']
            // }),
            // nodeResolve(),
            commonjs(),
            json(),
            babel()
        ]
    })
    .then(bundle => {
        cache = bundle;
        return bundle.write({
            dest: './cjs/index.js',
            sourceMap: true,
            format: 'cjs'
        });
    })
    .catch(console.error);
