[![npm version](https://img.shields.io/npm/v/micro-ex-router.svg?style=flat)](https://npmjs.org/package/micro-ex-router "View this project on npm")
[![Build Status](https://travis-ci.org/Masquerade-Circus/micro-ex-router.svg?branch=master)](https://travis-ci.org/Masquerade-Circus/micro-ex-router)
[![Dependencies](https://img.shields.io/david/masquerade-circus/micro-ex-router.svg?style=flat)](https://david-dm.org/masquerade-circus/micro-ex-router)
![](https://img.shields.io/github/issues/masquerade-circus/micro-ex-router.svg)
![](https://img.shields.io/snyk/vulnerabilities/npm/micro-ex-router.svg)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/521f72fc6d61426783692b62d64a3643)](https://www.codacy.com/app/Masquerade-Circus/micro-ex-router?utm_source=github.com&utm_medium=referral&utm_content=Masquerade-Circus/micro-ex-router&utm_campaign=Badge_Grade)
[![Maintainability](https://api.codeclimate.com/v1/badges/c1263dd7fb4f90194625/maintainability)](https://codeclimate.com/github/Masquerade-Circus/micro-ex-router/maintainability)
[![Coverage Status](https://coveralls.io/repos/github/Masquerade-Circus/micro-ex-router/badge.svg?branch=master)](https://coveralls.io/github/Masquerade-Circus/micro-ex-router?branch=master)
[![License](https://img.shields.io/github/license/masquerade-circus/micro-ex-router.svg)](https://github.com/masquerade-circus/micro-ex-router/blob/master/LICENSE)

# micro-ex-router

Express style router for zeit's [micro](https://github.com/zeit/micro).

## Table of Contents

-   [Install](#install)
-   [Features](#features)
-   [Use](#use)
-   [Use of subrouters](#use-of-subrouters)
-   [Use of Compression, CORS and other NodeJs Middlewares](#use-of-compression-cors-and-other-nodejs-middlewares)
-   [Use of Express middlewares](#use-of-express-middlewares)
-   [Serve files from a directory and render a string as html](#serve-files-from-a-directory-and-render-a-string-as-html)
-   [Available methods](#available-methods)
-   [Parsed body and query by default](#parsed-body-and-query-by-default)
-   [Tests](#tests)
-   [Contributing](#contributing)
-   [Legal](#legal)

## Install

This is a [Node.js](https://nodejs.org/en/) module available through the [npm registry](https://www.npmjs.com/):

```bash
// With npm
$ npm install micro-ex-router
// With yarn
$ yarn add micro-ex-router
```

## Features

-   [x] Default returned responses.
-   [x] Parametrized routes.
-   [x] Parse body by default
-   [x] Parse query by default
-   [x] "Use" middlewares.
-   [x] "Use" middlewares for each method.
-   [x] Arrays of middlewares.
-   [x] Mix single middlewares and array of middlewares.
-   [x] Use of subrouters.
-   [x] Serve files directory
-   [x] Render string as html

## Use

```javascript
let micro = require('micro');
let Router = require('micro-ex-router');
let defaultOptions = {
  parseBody: true, // Tells the router to parse the body by default
  limit: '1mb', // How much data is aggregated before parsing at max. It can be a Number of bytes or a string like '1mb'.
  encoding: 'utf8',
  acceptedMethods: [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'head',
    'options',
    'use'
  ] // The methods that will be handled by the router
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
  .get('/hello/:world', (req, res) => ({
    message: `Hello ${req.params.world}`
  }))

  // Sequenced middlewares no need to use next callback,
  // All middlewares are processed as async
  // The first returned response will be sent to the client
  .get('/hello/:world/whats/:up', [
    (req, res) => {
      res.locals = {};
      res.locals.response = {
        message: `Hello ${req.params.world} whats ${req.params.up}`
      };
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
  .get(
    '/mixed',
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

  .use(() => 'Not found');

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
  .use((req, res) => console.log('Sub router "Use" middleware'))
  .get(
    '/from/:country',
    (req, res) => `Hello ${req.params.world} from ${req.params.country}`
  );

// Create a new router
let router = Router();
router
  .use((req, res) => console.log(`${req.url}`))
  .use('/hello/:world', subrouter)
  .use(() => 'Not found');

// Init micro server
let server = micro(router);

server.listen(3000, async () => console.log('Micro listening on port 3000'));
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
  .use((req, res) => new Promise((next) => cors()(req, res, next)))

  // its the same as
  // .use((req, res) => new Promise(resolve => cors()(req, res, resolve)))

  // Add compression middleware
  .use((req, res) => new Promise((next) => compression()(req, res, next)))

  .get('/', () => 'Welcome to micro');

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
  msg: '{{res.statusCode}} {{req.method}} {{req.url}} {{res.responseTime}}ms',
  colorStatus: true
};

// Create a new router
let router = Router();

router
  // Add expressWinston middleware
  .use(
    (req, res) =>
      new Promise((next) =>
        expressWinston.logger(loggerOptions)(req, res, next)
      )
  )

  .get('/', () => 'Welcome to micro');

// Init micro server
let server = micro(router);

server.listen(3000, () => console.log('Micro listening on port 3000'));
```

-   Note that not all express plugins will work with this router. Express modify the request object adding more properties that other plugins may use. So, if the plugin use this properties then it will not work with `micro-ex-router`.

## Serve files from a directory and render a string as html

```javascript
let micro = require('micro');
let Router = require('micro-ex-router');

// Create a new router
let router = Router();

// To render with this headers
let htmlWithHeaders = {
  'Cache-Control': 'public, max-age=2592000',
  Expires: new Date(Date.now() + 604800000).toUTCString()
};

let defaultHeaders = {
  any: {
    'Cache-Control': 'no-cache'
  },
  css: {
    'Cache-Control': 'public, max-age=2592000',
    Expires: new Date(Date.now() + 604800000).toUTCString()
  }
};

let refreshFileListTime = 1000 * 60 * 60; // 60 minutes

router
  // Serve files from a directory
  .use(Router.serveDir('./public', defaultHeaders, refreshFileListTime))
  // Serve a single file
  .get('/file/:file', (req, res) =>
    Router.serveFile(res, `./public/${req.params.file}`, defaultHeaders)
  )
  // Serve a string as html
  .get('/render/html', Router.render('<html><body>Hello world</body></html>'))
  // Serve a string as html returned by a function
  .get(
    '/render/function',
    Router.render(() => '<html><body>Hello world</body></html>')
  )
  // Serve a string as html with custom headers
  .get(
    '/render/function',
    Router.render(() => '<html><body>Hello world</body></html>', htmlWithHeaders)
  )
  .use(() => 'Not found');

// Init micro server
let server = micro(router);

server.listen(3000, () => console.log('Micro listening on port 3000'));
```

## Available methods

-   Get
-   Post
-   Put
-   Patch
-   Delete
-   Head
-   Options

## Parsed body and query by default

Based on the Content-Type header, the router will try to parse the body.

-   If type === 'application/json' then parse the body as json
-   If type === 'application/x-www-form-urlencoded' then parse the body as form urlencoded
-   If type === 'text/html' then parse the body as text
-   If other type than the previous ones parse the body as buffer

If it receive query params, these params will be parsed and will be available on the `req.query` property

## Tests

`npm test`

## Contributing

-   Use prettify and eslint to lint your code.
-   Add tests for any new or changed functionality.
-   Update the readme with an example if you add or change any functionality.

## Legal

Author: [Masquerade Circus](http://masquerade-circus.net). License [Apache-2.0](https://opensource.org/licenses/Apache-2.0)
