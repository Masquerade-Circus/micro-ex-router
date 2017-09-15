let micro = require('micro');
let Router = require('../lib');
let defaultOptions = {
    parseBody: true, // Tells the router to parse the body by default
    limit: '1mb', // How much data is aggregated before parsing at max. It can be a Number of bytes or a string like '1mb'.
    encoding: 'utf8',
    acceptedMethods: ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'use'] // The methods that will be handled by the router
};

// Create a new router
let router = Router(defaultOptions);

router
    // Use middlewares available to all routes
    .use((req, res) => console.log(req.url))

    // Default returned responses
    .get('/', () => 'Welcome to micro')

    // Parametrized paths
    .get('/hello/:world', (req, res) => ({message: `Hello ${req.params.world}`}))

    // Sequenced middlewares no need to use next callback,
    // All middlewares are processed as async
    // The first returned response will be sent to the client
    .get('/hello/:world/whats/:up', [
        (req, res) => {
            res.locals = {};
            res.locals.response = {message: `Hello ${req.params.world} whats ${req.params.up}`};
        },
        (req, res) => {
            return res.locals.response;
        }
    ])

    // Default parsed body for all methods other than get
    // Based on the Content-Type parses json, formurlencoded and text
    .post('/hello', (req,res) => req.body)

    // Default parsed query parameters
    // if you call /hello/with/params?hello=world
    // then req.query = {hello: "world"}
    .get('/hello/with/params', (req,res) => req.query)
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
        await selfRequest('/hello/mike');
        await selfRequest('/hello/mike/whats/up');
        await selfRequest('/hello/mike');
        await selfRequest('/hello', 'post', {hello: 'world'});
        await selfRequest('/hello/with/params?hello=world');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        console.log('Done');
        process.exit();
    }

});
