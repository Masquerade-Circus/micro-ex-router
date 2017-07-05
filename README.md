# micro-ex-router

Express like router for zeit's [micro](https://github.com/zeit/micro).

## Install

This is a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/):

```bash
// With npm
$ npm install micro-ex-router
// With yarn
$ yarn add micro-ex-router
```

## Use

```javascript
let micro = require('micro');
let Router = require('micro-ex-router');

// Create a new router
let router = Router();

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
;

// Init micro server
let server = micro(router);

server.listen(3000, () => console.log('Micro listening on port 3000'));
```
## Features

- [X] Default returned responses.
- [X] Parametrized routes.
- [X] "Use" middlewares.
- [X] Arrays of middlewares.
- [] Mix single middlewares and array of middlewares.
- [] Use of subrouters.

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)
