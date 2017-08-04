let micro = require('micro');
let Router = require('../lib');

// Create a new router
let router = Router();

router
    .use((req, res) => console.log(`${req.url}`))
    // Mix of single middlewares and array of middlewares
    .get('/url/:url',
        (req, res) => console.log('Middleware 1'),
        [
            (req, res) => console.log('Middleware 1.1'),
            (req, res) => console.log('Middleware 1.2'),
            [
                (req, res) => console.log('Middleware 1.2.1'),
                (req, res) => console.log('Middleware 1.2.2')
            ]
        ],
        (req, res) => console.log('Middleware 2'),
        (req, res) => 'This is the final response'
    )
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
