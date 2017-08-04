let micro = require('micro');
let Router = require('../lib');

// Create a new router
let router = Router();

router
    .use((req, res) => console.log(`${req.url}`))
    .use((req, res) => console.log('Use middleware for all requests'))
    .get((req, res) => console.log('Use middleware only for GET requests'))
    .use('/url/*', (req, res) => console.log('Use middleware for all requests starting with /url/'))
    .get('/url/*', (req, res) => console.log('Middleware only for GET\'s requests starting with /url/'))
    .get('/url/:url', (req) => `${req.params.url}`)
    .use(() => 'Not found')
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
        await selfRequest('/url/ok');
        await selfRequest('/hello/mike');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        console.log('Done');
        process.exit();
    }

});
