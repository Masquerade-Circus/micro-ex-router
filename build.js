let rollup = require('rollup').rollup,
    babel = require('rollup-plugin-babel'),
    cache;

rollup({
        entry: './lib/index.js',
        cache: cache,
        plugins: [
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
