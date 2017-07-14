let micro = require('micro'),
    urlencodedBodyParser = require('urlencoded-body-parser'),
    url = require('url'),
    qs = require('querystring');

let acceptedMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

/**
 * Adds a path to a router
 * @method addPath
 * @param  {Router} router              The router in which to add the path
 * @param  {String} method              The method that will handle this path
 * @param  {String} path                The path to handle
 * @param  {Function|Array} middleware  Middleware function or an array of middlewares to be called when the path matches
 */
let addPath = (router, method, path, middleware) => {
    // Find the params like express params
    let params = path.match(/:(\w+)?/gi) || [];

    // Set the names of the params found
    for (let i in params) {
        params[i] = params[i].replace(':', '');
    }

    // Adds the path to the selected method
    router.paths[method][path] = {
        // RegExp that will be used to match against the requested path
        regexp : new RegExp('^' + path.replace(/:(\w+)/gi, '([^\\s\\/]+)') + '/?(\\?.*)?$', 'gi'),
        // The name of the params if any
        params: params,
        // The middleware(s) to call when this path matches
        middleware: middleware
    };

    // return the pased router
    return router;
};


let RouterFactory = (options = {}) => {
    let opt = Object.assign({}, { limit: '1mb', encoding: 'utf8' }, options);

    /**
     * new Rotuer
     * @param  {Request}    req     NodeJs Request object
     * @param  {Response}   res     NodeJs Response object
     * @return {Function}           The async function to be passed to micro
     */
    let Router = async function (req, res) {
        let urls = Router.paths[req.method.toLowerCase()];
        let middleware;

        // Find first matched url
        for (let i in urls) {
            let matches = urls[i].regexp.exec(req.url);
            urls[i].regexp.lastIndex = -1;
            if (Array.isArray(matches)) {
                matches.shift();
                await Router.parseBody(req);
                let k = urls[i].params.length;
                for (; k--;) {
                    req.params[urls[i].params[k]] = matches[k];
                }
                middleware = urls[i].middleware;
                break;
            }
        }

        // If there is an url match
        if (middleware !== undefined) {
            let response;

            // Call the use middlewares
            let l = Router.useMiddlewares.length, i = 0;

            for (; i < l; i++) {
                response = await Router.useMiddlewares[i](req, res);
                if (response !== undefined && !res.headersSent) {
                    return response;
                }
            }

            // if middleware is an array of middlewares call them sequentially
            if (Array.isArray(middleware)) {
                let l = middleware.length, i = 0;
                // call sequentially every middleware
                for (; i < l; i++) {
                    response = await middleware[i](req, res);
                    if (response !== undefined && !res.headersSent) {
                        return response;
                    }
                }
            }

            // If middleware it's not an array, call it and return its response
            return await middleware(req, res);
        }

        // If no url is matched throw a new error
        throw new Error(`The url ${req.url} requested by ${req.method.toLowerCase()}, wasn't found`);
    };

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
    Router.use = middleware => {
        Router.useMiddlewares.push(middleware);
        return Router;
    };

    /**
     * For each accepted method, add the method to the router
     * @type {Array}
     */
    acceptedMethods.map(method => {
        Router.paths[method] = {};
        Router[method] = (path, middleware) => addPath(Router, method, path, middleware);
    });

    /**
     * Parses the body according with its content-type
     * @method parseBody
     * @param  {Request}    req
     * @return {Void}
     */
    Router.parseBody = async (req) => {
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
        req.query = Object.assign({}, qs.parse(url.parse(req.url).query));

        /**
         * If the method is other than get try to parse the body
         * @method if
         * @param  {Request} req
         */
        if (req.method.toLowerCase() !== 'get') {
            let type = req.headers['content-type'],
                parsed = false,
                options = {
                    limit: opt.limit,
                    encoding: opt.encoding
                },
                body;

            try {
                if (type === 'application/json') {
                    parsed = true;
                    body = await micro.json(req, options);
                }

                if (type === 'application/x-www-form-urlencoded' && !parsed) {
                    parsed = true;
                    body = await urlencodedBodyParser(req, options);
                }

                if (type === 'text/html' && !parsed) {
                    parsed = true;
                    body = await micro.text(req, options);
                }

                if (!parsed) {
                    body = await micro.buffer(req, options);
                }
            } catch (e) {

            }

            req.body = body;
        }
    };

    /**
     * Return the new router
     * @type {Router}
     */
    return Router;
};

module.exports = RouterFactory;
