let micro = require('micro');
let Router = require('../lib');
let compression = require('compression');

// Create a new router
let router = Router();

router
    // Add compression middleware
    .use((req, res) => new Promise(next => compression()(req, res, next)))

    // its the same as
    // .use((req, res) => new Promise(resolve => compression()(req, res, resolve)))

    .get('/', () => 'Welcome to micro')
;

// Init micro server
let server = micro(router);

server.listen(3000, async () => {
    console.log('Micro listening on port 3000');

    /**
     * Load the selfRequest function to test the server paths
     * @type {Function}
     */
    let selfRequest = require('../helpers/self_request');

    // Do a request to test every route
    try {
        await selfRequest('/');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        console.log('Done');
        process.exit();
    }

});
