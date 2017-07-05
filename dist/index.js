'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
            return new RegExp('^' + path.replace(/:(\w+)/gi, "(\\w+)") + '/?$', 'gi');
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

    /**
     * new Rotuer
     * @param  {Request}    req     NodeJs Request object
     * @param  {Response}   res     NodeJs Response object
     * @return {Function}           The async function to be passed to micro
     */
    var Router = function () {
        var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(req, res) {
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
                                _context.next = 14;
                                break;
                            }

                            i = _context.t1.value;
                            matches = urls[i].regexp().exec(req.url);

                            if (!Array.isArray(matches)) {
                                _context.next = 12;
                                break;
                            }

                            matches.shift();
                            req.params = {};
                            for (k in urls[i].params) {
                                req.params[urls[i].params[k]] = matches[k];
                            }
                            middleware = urls[i].middleware;
                            return _context.abrupt('break', 14);

                        case 12:
                            _context.next = 3;
                            break;

                        case 14:
                            if (!(middleware !== undefined)) {
                                _context.next = 40;
                                break;
                            }

                            response = void 0;

                            // Call the use middlewares

                            l = Router.useMiddlewares.length, _i = 0;

                        case 17:
                            if (!(_i < l)) {
                                _context.next = 26;
                                break;
                            }

                            _context.next = 20;
                            return Router.useMiddlewares[_i](req, res);

                        case 20:
                            response = _context.sent;

                            if (!(response !== undefined || res.headersSent)) {
                                _context.next = 23;
                                break;
                            }

                            return _context.abrupt('return', response);

                        case 23:
                            _i++;
                            _context.next = 17;
                            break;

                        case 26:
                            if (!Array.isArray(middleware)) {
                                _context.next = 37;
                                break;
                            }

                            _l = middleware.length, _i2 = 0;
                            // call sequentially every middleware

                        case 28:
                            if (!(_i2 < _l)) {
                                _context.next = 37;
                                break;
                            }

                            _context.next = 31;
                            return middleware[_i2](req, res);

                        case 31:
                            response = _context.sent;

                            if (!(response !== undefined || res.headersSent)) {
                                _context.next = 34;
                                break;
                            }

                            return _context.abrupt('return', response);

                        case 34:
                            _i2++;
                            _context.next = 28;
                            break;

                        case 37:
                            _context.next = 39;
                            return middleware(req, res);

                        case 39:
                            return _context.abrupt('return', _context.sent);

                        case 40:
                            throw new Error('The url ' + req.url + ' requested by ' + req.method.toLowerCase() + ', wasn\'t found');

                        case 41:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        return function Router(_x, _x2) {
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
     * Return the new router
     * @type {Router}
     */
    return Router;
};

module.exports = RouterFactory;
//# sourceMappingURL=index.js.map
