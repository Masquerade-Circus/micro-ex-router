# micro-ex-router

Express style router for zeit's [micro](https://github.com/zeit/micro).

## Install

This is a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/):

```bash
// With npm
$ npm install micro-ex-router
// With yarn
$ yarn add micro-ex-router
```
## Features

- [X] Default returned responses.
- [X] Parametrized routes.
- [X] Parse body by default
- [X] Parse query by default
- [X] "Use" middlewares.
- [X] "Use" middlewares for each method.
- [X] Arrays of middlewares.
- [X] Mix single middlewares and array of middlewares.
- [X] Use of subrouters.

## Use

```javascript
let micro = require('micro');
let Router = require('micro-ex-router');
let defaultOptions = {
    parseBody: true, // Tells the router to parse the body by default
    limit: '1mb', // How much data is aggregated before parsing at max. It can be a Number of bytes or a string like '1mb'.
    encoding: 'utf8',
    acceptedMethods: ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'use'] // The methods that will be handled by the router
};

// Create a new router
let router = Router(defaultOptions);

router
    // Use middlewares available for all requests
    .use((req, res) => console.log(req.url))

    // Use middlewares available for all requests restricted by each method
    .get((req, res) => console.log('This is a get request')) // Only for GET requests
    .post((req, res) => console.log('This is a post request')) // Only for POST requests
    .put((req, res) => console.log('This is a put request')) // Only for PUT requests
    .patch((req, res) => console.log('This is a patch request')) // Only for PATCH requests
    .delete((req, res) => console.log('This is a delete request')) // Only for DELETE requests
    .head((req, res) => console.log('This is a head request')) // Only for HEAD requests
    .options((req, res) => console.log('This is an options request')) // Only for OPTIONS requests

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
    // Based on the Content-Type parses json, formurlencoded, text and and buffer
    .post('/hello', () => req.body)

    // Default parsed query parameters
    // if you call /hello/with/query/params?hello=world
    // then req.query = {hello: "world"}
    .get('/hello/with/query/params', () => req.query)

    // Mix single and array of middlewares
    .get('/mixed',
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

server.listen(3000, () => console.log('Micro listening on port 3000'));
```

## Use of subrouters
```javascript
let micro = require('micro');
let Router = require('micro-ex-router');

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

server.listen(3000, async () => console.log('Micro listening on port 3000'));
```

## Use with Babel
```javascript
// index.js
require('babel-register');
require('babel-polyfill');
require('./app');

// app.js
let Router = require('micro-ex-router/cjs');
```

## Use of Compression, CORS and other NodeJs Middlewares
```javascript
let micro = require('micro');
let Router = require('micro-ex-router');
let compression = require('compression');
let cors = require('cors');

// Create a new router
let router = Router();

router
    // Add cors middleware
    .use((req, res) => new Promise(next => cors()(req, res, next)))

    // its the same as
    // .use((req, res) => new Promise(resolve => cors()(req, res, resolve)))

    // Add compression middleware
    .use((req, res) => new Promise(next => compression()(req, res, next)))

    .get('/', () => 'Welcome to micro')
;

// Init micro server
let server = micro(router);

server.listen(3000, () => console.log('Micro listening on port 3000'));
```

## Use of Express middlewares
```javascript
let micro = require('micro');
let Router = require('micro-ex-router');

/**
 * Load and configure the express winston middleware
 */
let transports = require('winston').transports;
let expressWinston = require('express-winston');
let loggerOptions = {
    transports: [new transports.Console({ colorize: true })],
    meta: false,
    msg: "{{res.statusCode}} {{req.method}} {{req.url}} {{res.responseTime}}ms",
    colorStatus: true
};


// Create a new router
let router = Router();

router
    // Add expressWinston middleware
    .use((req, res) => new Promise(next => expressWinston.logger(loggerOptions)(req, res, next)))

    .get('/', () => 'Welcome to micro')
;

// Init micro server
let server = micro(router);

server.listen(3000, () => console.log('Micro listening on port 3000'));
```
* Note that not all express plugins will work with this router. Express modify the request object adding more properties that other plugins may use. So, if the plugin use this properties then it will not work with `micro-ex-router`.

## Available methods

- Get
- Post
- Put
- Patch
- Delete
- Head
- Options

## Parsed body and query by default

Based on the Content-Type header, the router will try to parse the body.
- If type === 'application/json' then parse the body as json
- If type === 'application/x-www-form-urlencoded' then parse the body as form urlencoded
- If type === 'text/html' then parse the body as text
- If other type than the previous ones parse the body as buffer

If it receive query params, these params will be parsed and will be available on the `req.query` property

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)
