'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var micro = _interopDefault(require('micro'));
var urlencodedBodyParser = _interopDefault(require('urlencoded-body-parser'));
var url = _interopDefault(require('url'));
var querystring = _interopDefault(require('querystring'));

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

var _this = undefined;

var acceptedMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

/**
 * Adds a path to a router
 * @method addPath
 * @param  {Router} router              The router in which to add the path
 * @param  {String} method              The method that will handle this path
 * @param  {String} path                The path to handle
 * @param  {Function|Array} middleware  Middleware function or an array of middlewares to be called when the path matches
 */
var addPath = function addPath(router, method, path, middleware) {
    // Find the params like express params
    var params = path.match(/:(\w+)?/gi);

    // Set the names of the params found
    if (Array.isArray(params)) {
        for (var i in params) {
            params[i] = params[i].replace(':', '');
        }
    }

    // Adds the path to the selected method
    router.paths[method][path] = {
        // RegExp that will be used to match against the requested path
        regexp: function regexp() {
            return new RegExp('^' + path.replace(/:(\w+)/gi, "(\\w+)") + '/?(\\?.*)?$', 'gi');
        },
        // The name of the params if any
        params: params,
        // The middleware(s) to call when this path matches
        middleware: middleware
    };

    // return the pased router
    return router;
};

var RouterFactory = function RouterFactory() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var opt = Object.assign({}, { limit: '1mb', encoding: 'utf8' }, options);

    /**
     * new Rotuer
     * @param  {Request}    req     NodeJs Request object
     * @param  {Response}   res     NodeJs Response object
     * @return {Function}           The async function to be passed to micro
     */
    var Router = function () {
        var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee(req, res) {
            var urls, middleware, i, matches, k, response, l, _i, _l, _i2;

            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            urls = Router.paths[req.method.toLowerCase()];
                            middleware = void 0;

                            // Find first matched url

                            _context.t0 = regeneratorRuntime.keys(urls);

                        case 3:
                            if ((_context.t1 = _context.t0()).done) {
                                _context.next = 15;
                                break;
                            }

                            i = _context.t1.value;
                            matches = urls[i].regexp().exec(req.url);

                            if (!Array.isArray(matches)) {
                                _context.next = 13;
                                break;
                            }

                            matches.shift();
                            _context.next = 10;
                            return Router.parseBody(req);

                        case 10:
                            for (k in urls[i].params) {
                                req.params[urls[i].params[k]] = matches[k];
                            }
                            middleware = urls[i].middleware;
                            return _context.abrupt('break', 15);

                        case 13:
                            _context.next = 3;
                            break;

                        case 15:
                            if (!(middleware !== undefined)) {
                                _context.next = 41;
                                break;
                            }

                            response = void 0;

                            // Call the use middlewares

                            l = Router.useMiddlewares.length, _i = 0;

                        case 18:
                            if (!(_i < l)) {
                                _context.next = 27;
                                break;
                            }

                            _context.next = 21;
                            return Router.useMiddlewares[_i](req, res);

                        case 21:
                            response = _context.sent;

                            if (!(response !== undefined || res.headersSent)) {
                                _context.next = 24;
                                break;
                            }

                            return _context.abrupt('return', response);

                        case 24:
                            _i++;
                            _context.next = 18;
                            break;

                        case 27:
                            if (!Array.isArray(middleware)) {
                                _context.next = 38;
                                break;
                            }

                            _l = middleware.length, _i2 = 0;
                            // call sequentially every middleware

                        case 29:
                            if (!(_i2 < _l)) {
                                _context.next = 38;
                                break;
                            }

                            _context.next = 32;
                            return middleware[_i2](req, res);

                        case 32:
                            response = _context.sent;

                            if (!(response !== undefined || res.headersSent)) {
                                _context.next = 35;
                                break;
                            }

                            return _context.abrupt('return', response);

                        case 35:
                            _i2++;
                            _context.next = 29;
                            break;

                        case 38:
                            _context.next = 40;
                            return middleware(req, res);

                        case 40:
                            return _context.abrupt('return', _context.sent);

                        case 41:
                            throw new Error('The url ' + req.url + ' requested by ' + req.method.toLowerCase() + ', wasn\'t found');

                        case 42:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        return function Router(_x2, _x3) {
            return _ref.apply(this, arguments);
        };
    }();

    /**
     * Where to store the paths and its middlewares
     * @type {Object}
     */
    Router.paths = {};

    /**
     * Where to store the use middlewares
     * @type {Array}
     */
    Router.useMiddlewares = [];

    /**
     * Use method to add middlewares for every path
     * @method use
     * @param  {Function} middleware    The middleware to add
     * @return {Router}
     */
    Router.use = function (middleware) {
        Router.useMiddlewares.push(middleware);
        return Router;
    };

    /**
     * For each accepted method, add the method to the router
     * @type {Array}
     */
    acceptedMethods.map(function (method) {
        Router.paths[method] = {};
        Router[method] = function (path, middleware) {
            return addPath(Router, method, path, middleware);
        };
    });

    /**
     * Parses the body according with its content-type
     * @method parseBody
     * @param  {Request}    req
     * @return {Void}
     */
    Router.parseBody = function () {
        var _ref2 = asyncToGenerator(regeneratorRuntime.mark(function _callee2(req) {
            var type, parsed, _options, body;

            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            /**
                             * Set the params property to an empty object
                             * @type {Object}
                             */
                            req.params = req.params || {};

                            /**
                             * Set the body property to undefined
                             * @type {Undefined}
                             */
                            req.body = undefined;

                            /**
                             * Set the query object
                             * The object returned by the querystring.parse() method does not prototypically inherit from the JavaScript Object.
                             * So we create a new object and merge its properties
                             * @type {Object}
                             */
                            req.query = Object.assign({}, querystring.parse(url.parse(req.url).query));

                            /**
                             * If the method is other than get try to parse the body
                             * @method if
                             * @param  {Request} req
                             */

                            if (!(req.method.toLowerCase() !== 'get')) {
                                _context2.next = 30;
                                break;
                            }

                            type = req.headers['content-type'], parsed = false, _options = {
                                limit: opt.limit,
                                encoding: opt.encoding
                            }, body = void 0;
                            _context2.prev = 5;

                            if (!(type === 'application/json')) {
                                _context2.next = 11;
                                break;
                            }

                            parsed = true;
                            _context2.next = 10;
                            return micro.json(req, _options);

                        case 10:
                            body = _context2.sent;

                        case 11:
                            if (!(type === 'application/x-www-form-urlencoded' && !parsed)) {
                                _context2.next = 16;
                                break;
                            }

                            parsed = true;
                            _context2.next = 15;
                            return urlencodedBodyParser(req, _options);

                        case 15:
                            body = _context2.sent;

                        case 16:
                            if (!(type === 'text/html' && !parsed)) {
                                _context2.next = 21;
                                break;
                            }

                            parsed = true;
                            _context2.next = 20;
                            return micro.text(req, _options);

                        case 20:
                            body = _context2.sent;

                        case 21:
                            if (parsed) {
                                _context2.next = 25;
                                break;
                            }

                            _context2.next = 24;
                            return micro.buffer(req, _options);

                        case 24:
                            body = _context2.sent;

                        case 25:
                            _context2.next = 29;
                            break;

                        case 27:
                            _context2.prev = 27;
                            _context2.t0 = _context2['catch'](5);

                        case 29:

                            req.body = body;

                        case 30:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, _this, [[5, 27]]);
        }));

        return function (_x4) {
            return _ref2.apply(this, arguments);
        };
    }();

    /**
     * Return the new router
     * @type {Router}
     */
    return Router;
};

var index = RouterFactory;

module.exports = index;
//# sourceMappingURL=index.js.map
