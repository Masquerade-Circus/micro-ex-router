let micro = require('micro');
let Router = require('../lib');

// Create a sub router
let subrouter = Router();
subrouter
    .use((req, res) => console.log('Sub router "Use" middleware'))
    .get('/from/:country', (req, res) => `Hello ${req.params.world} from ${req.params.country}`)
    .get('/', (req) => `Hello ${req.params.world}`)
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
// server.listen(3000, () => console.log('Micro listening on port 3000'));
module.exports = server;
