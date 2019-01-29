let micro = require('micro');
let Router = require('../lib');

// Create a new router
let router = Router();

router
  .use((req, res) => console.log(`${req.url}`))
  .use((req, res) => console.log('Use middleware for all requests'))
  .get((req, res) => console.log('Use middleware only for GET requests'))
  .use('/url/*', (req, res) =>
    console.log('Use middleware for all requests starting with /url/')
  )
  .get('/url/*', (req, res) =>
    console.log("Middleware only for GET's requests starting with /url/")
  )
  .get('/url/:url', (req) => `${req.params.url}`)
  .use(() => 'Not found');

// Init micro server
let server = micro(router);
// server.listen(3000, () => console.log('Micro listening on port 3000'));
module.exports = server;
