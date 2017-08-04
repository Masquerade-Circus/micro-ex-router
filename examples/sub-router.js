let micro = require('micro');
let Router = require('../lib');

// Create a sub router
let subrouter = Router();
subrouter
    .use((req,res) => console.log('Sub router "Use" middleware'))
    .get('/from/:country', (req,res) => `Hello ${req.params.world} from ${req.params.country}`)
;

// Create a new router
let router = Router();
router
    .use((req, res) => console.log(`${req.url}`))
    .use('/hello/:world', subrouter)
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
        await selfRequest('/hello/mike');
        await selfRequest('/hello/mike/from/usa');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        console.log('Done');
        process.exit();
    }

});
