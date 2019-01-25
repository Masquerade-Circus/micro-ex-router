let micro = require('micro');
let Router = require('../lib');

// Create a new router
let router = Router();

router
    .use(Router.serveDir('./examples'))
    .get('/public', Router.serveDir('./examples'))
    .get('/file/:file', (req, res) => Router.serveFile(res, `./examples/${req.params.file}`))
    .get('/render/html', Router.render('<html><body>Hello world</body></html>'))
    .get('/render/function', Router.render(() => '<html><body>Hello world</body></html>'))
    .get('/render/headers', Router.render(() => '<html><body>Hello world</body></html>', {
        'Cache-Control': 'public, max-age=2592000'
    }))

    .use(() => 'Not found')
;

// Init micro server
let server = micro(router);
// server.listen(3000, () => console.log('Micro listening on port 3000'));
module.exports = server;
