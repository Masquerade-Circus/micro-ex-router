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

var acceptedMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'use'];

/**
 * Handles the mix of single and array of middlewares
 * @method parseMiddlewares
 * @param  {Function|Array}         middlewares     // Middleware or array of middlewares
 * @param  {Array}                  [array=[]]      // The array to store the final list of middlewares
 * @return {Array}                                  // The final list of middlewares
 */
var parseMiddlewares = function parseMiddlewares(middlewares) {
    var array = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    if (typeof middlewares === 'function') {
        array.push(middlewares);
        return array;
    }

    var i = 0,
        l = middlewares.length;
    for (; i < l; i++) {
        if (Array.isArray(middlewares[i])) {
            parseMiddlewares(middlewares[i], array);
        }

        if (!Array.isArray(middlewares[i])) {
            array.push(middlewares[i]);
        }
    }
    return array;
};

/**
 * Adds a path to a router
 * @method addPath
 * @param  {Router} router              The router in which to add the path
 * @param  {String} method              The method that will handle this path
 * @param  {Array} args                The mixed params (String|Function|Array)
 */
var addPath = function addPath(router, method, args) {
    var path = void 0,
        middlewares = void 0;

    // Get the first argument
    if (typeof args[0] === 'string') {
        path = args.shift();
    }

    // If the seccond argument is a function and has paths
    // and regexpList properties then
    // Treat it as a subrouter
    if (typeof args[0] === 'function' && args[0].paths !== undefined && args[0].regexpList !== undefined) {
        var subrouter = args.shift(),
            i = 0,
            l = subrouter.paths.length;

        // For each path of the subrouter
        for (; i < l; i++) {
            var submiddlewares = subrouter.paths[i].middlewares;
            var submethod = subrouter.paths[i].method;
            var subpath = subrouter.paths[i].path;

            // If there is a path add it as prefix to the subpath
            if (path !== undefined) {
                subpath = path + (subpath || '*');
            }

            // If there are a subpath set it as the first element
            // on the submiddlewares array
            if (subpath !== undefined) {
                submiddlewares.unshift(subpath);
            }

            // Add the path to the router
            router = addPath(router, submethod, submiddlewares);
        }
    }

    // Parse middlwares to handle mixed arrays of middlwares and sequenced middlwares
    middlewares = parseMiddlewares(args);

    // Add the path only if there are middlewares passed
    if (middlewares.length > 0) {
        // If the path wasn't set before, set the regexp and params list
        if (path !== undefined && router.regexpList[path] === undefined) {
            // Remove the last slash
            path = path.replace(/\/(\?.*)?$/gi, '$1');

            // Find the params like express params
            var params = path.match(/:(\w+)?/gi) || [];

            // Set the names of the params found
            for (var _i in params) {
                params[_i] = params[_i].replace(':', '');
            }

            var regexpPath = path
            // Catch params
            .replace(/:(\w+)/gi, '([^\\s\\/]+)')
            // To set to any url with the path as prefix
            .replace(/\*/g, '.*')
            // Remove the last slash
            .replace(/\/(\?.*)?$/gi, '$1');

            // Set the object to the path
            router.regexpList[path] = {
                regexp: new RegExp('^' + regexpPath + '/?(\\?.*)?$', 'gi'),
                params: params
            };
        }

        // Add the path to the paths list
        router.paths.push({
            method: method,
            path: path,
            middlewares: middlewares
        });
    }

    return router;
};

/**
 * Parses the body according with its content-type
 * @method parseBody
 * @param  {Request}    req
 * @return {Void}
 */
var parseBody = function () {
    var _ref = asyncToGenerator(regeneratorRuntime.mark(function _callee(req, opt) {
        var type, parsed, options, body;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
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
                            _context.next = 30;
                            break;
                        }

                        type = req.headers['content-type'], parsed = false, options = {
                            limit: opt.limit,
                            encoding: opt.encoding
                        }, body = void 0;
                        _context.prev = 5;

                        if (!(type === 'application/json')) {
                            _context.next = 11;
                            break;
                        }

                        parsed = true;
                        _context.next = 10;
                        return micro.json(req, options);

                    case 10:
                        body = _context.sent;

                    case 11:
                        if (!(type === 'application/x-www-form-urlencoded' && !parsed)) {
                            _context.next = 16;
                            break;
                        }

                        parsed = true;
                        _context.next = 15;
                        return urlencodedBodyParser(req, options);

                    case 15:
                        body = _context.sent;

                    case 16:
                        if (!(type === 'text/html' && !parsed)) {
                            _context.next = 21;
                            break;
                        }

                        parsed = true;
                        _context.next = 20;
                        return micro.text(req, options);

                    case 20:
                        body = _context.sent;

                    case 21:
                        if (parsed) {
                            _context.next = 25;
                            break;
                        }

                        _context.next = 24;
                        return micro.buffer(req, options);

                    case 24:
                        body = _context.sent;

                    case 25:
                        _context.next = 29;
                        break;

                    case 27:
                        _context.prev = 27;
                        _context.t0 = _context['catch'](5);

                    case 29:

                        req.body = body;

                    case 30:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, _this, [[5, 27]]);
    }));

    return function parseBody(_x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

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
        var _ref2 = asyncToGenerator(regeneratorRuntime.mark(function _callee2(req, res) {
            var method, params, middlewares, response, i, l, path, matches, _l, _i2, _l2;

            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            method = req.method.toLowerCase(), params = {}, middlewares = [], response = void 0, i = 0, l = Router.paths.length;

                        case 1:
                            if (!(i < l)) {
                                _context2.next = 14;
                                break;
                            }

                            path = Router.paths[i];

                            if (!(method !== path.method && path.method !== 'use')) {
                                _context2.next = 5;
                                break;
                            }

                            return _context2.abrupt('continue', 11);

                        case 5:
                            if (!((path.method === 'use' || method === path.method) && path.path === undefined)) {
                                _context2.next = 8;
                                break;
                            }

                            middlewares = parseMiddlewares(path.middlewares, middlewares);
                            return _context2.abrupt('continue', 11);

                        case 8:
                            matches = Router.regexpList[path.path].regexp.exec(req.url);

                            Router.regexpList[path.path].regexp.lastIndex = -1;
                            if (Array.isArray(matches)) {
                                matches.shift();
                                _l = Router.regexpList[path.path].params.length;

                                for (; _l--;) {
                                    if (params[Router.regexpList[path.path].params[_l]] === undefined) {
                                        params[Router.regexpList[path.path].params[_l]] = matches[_l];
                                    }
                                }
                                middlewares = parseMiddlewares(path.middlewares, middlewares);
                            }

                        case 11:
                            i++;
                            _context2.next = 1;
                            break;

                        case 14:
                            if (!(middlewares.length > 0)) {
                                _context2.next = 30;
                                break;
                            }

                            _context2.next = 17;
                            return parseBody(req, opt);

                        case 17:
                            req.params = params;

                            _i2 = 0, _l2 = middlewares.length;
                            // call sequentially every middleware

                        case 19:
                            if (!(_i2 < _l2)) {
                                _context2.next = 28;
                                break;
                            }

                            _context2.next = 22;
                            return middlewares[_i2](req, res);

                        case 22:
                            response = _context2.sent;

                            if (!(response !== undefined || res.headersSent)) {
                                _context2.next = 25;
                                break;
                            }

                            return _context2.abrupt('break', 28);

                        case 25:
                            _i2++;
                            _context2.next = 19;
                            break;

                        case 28:
                            if (!(response !== undefined && !res.headersSent)) {
                                _context2.next = 30;
                                break;
                            }

                            return _context2.abrupt('return', response);

                        case 30:
                            if (res.headersSent) {
                                _context2.next = 32;
                                break;
                            }

                            throw new Error('The url ' + req.url + ' requested by ' + method + ', wasn\'t found');

                        case 32:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));

        return function Router(_x5, _x6) {
            return _ref2.apply(this, arguments);
        };
    }();

    /**
     * Where to store the paths and its middlewares
     * @type {Object}
     */
    Router.paths = [];

    /**
     * Where to store the regexp and params list for the paths
     * @type {[type]}
     */
    Router.regexpList = {};

    /**
     * For each accepted method, add the method to the router
     * @type {Array}
     */
    acceptedMethods.map(function (method) {
        Router[method] = function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return addPath(Router, method, args);
        };
    });

    /**
     * Return the new router
     * @type {Router}
     */
    return Router;
};

var index = RouterFactory;

module.exports = index;
//# sourceMappingURL=index.js.map
