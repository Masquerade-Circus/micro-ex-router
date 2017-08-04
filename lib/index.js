let micro = require('micro'),
    urlencodedBodyParser = require('urlencoded-body-parser'),
    url = require('url'),
    qs = require('querystring');

let acceptedMethods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'use'];

let parseMiddlewares = (middlewares, array = []) => {
    if (typeof middlewares === 'function') {
        return [middlewares];
    }

    let i = 0, l = middlewares.length;
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
let addPath = (router, method, args) => {
    let path, middlewares;

    // Get the first argument
    if (typeof args[0] === 'string') {
        path = args.shift();
    }

    // Parse middlwares to handle mixed arrays of middlwares and sequenced middlwares
    middlewares = parseMiddlewares(args);

    // If the path wasn't set before, set the regexp and params list
    if (path !== undefined && router.regexpList[path] === undefined) {
        // Find the params like express params
        let params = path.match(/:(\w+)?/gi) || [];

        // Set the names of the params found
        for (let i in params) {
            params[i] = params[i].replace(':', '');
        }

        // Set the object to the path
        router.regexpList[path] = {
            regexp : new RegExp('^' + path.replace(/:(\w+)/gi, '([^\\s\\/]+)').replace(/\*/g, '.*')  + '/?(\\?.*)?$', 'gi'),
            params: params
        }
    }

    // Add the path to the paths list
    router.paths.push({
        method: method,
        path: path,
        middlewares: middlewares
    });

    return router;
};

/**
 * Parses the body according with its content-type
 * @method parseBody
 * @param  {Request}    req
 * @return {Void}
 */
let parseBody = async (req) => {
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

let RouterFactory = (options = {}) => {
    let opt = Object.assign({}, { limit: '1mb', encoding: 'utf8' }, options);

    /**
     * new Rotuer
     * @param  {Request}    req     NodeJs Request object
     * @param  {Response}   res     NodeJs Response object
     * @return {Function}           The async function to be passed to micro
     */
    let Router = async function (req, res) {
        let method = req.method.toLowerCase(),
            params = {},
            middlewares = [],
            response,
            i = 0,
            l = Router.paths.length;

        for (; i < l; i++) {
            let path = Router.paths[i];
            if (method !== path.method && path.method !== 'use') {
                continue;
            }

            if ((path.method === 'use' || method === path.method) && path.path === undefined) {
                middlewares = parseMiddlewares(path.middlewares, middlewares);
                continue;
            }

            let matches = Router.regexpList[path.path].regexp.exec(req.url);
            Router.regexpList[path.path].regexp.lastIndex = -1;
            if (Array.isArray(matches)) {
                matches.shift();
                let l = Router.regexpList[path.path].params.length;
                for (; l--;) {
                    if (params[Router.regexpList[path.path].params[l]] === undefined) {
                        params[Router.regexpList[path.path].params[l]] = matches[l];
                    }
                }
                middlewares = parseMiddlewares(path.middlewares, middlewares);
            }
        }

        if (middlewares.length > 0) {
            await parseBody(req);
            req.params = params;

            let i = 0, l = middlewares.length;
            // call sequentially every middleware
            for (; i < l; i++) {
                response = await middlewares[i](req, res);
                // If there is a response or a response was sent to the client
                // break the for block
                if (response !== undefined || res.headersSent) {
                    break;
                }
            }

            // If there is a response and no other response was sent to the client
            // return the response
            if (response !== undefined && !res.headersSent) {
                return response;
            }
        }

        // If no response was sent to the client throw an error
        if (!res.headersSent) {
            throw new Error(`The url ${req.url} requested by ${method}, wasn't found`);
        }
    };

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
    acceptedMethods.map(method => {
        Router[method] = (...args) => addPath(Router, method, args);
    });

    /**
     * Return the new router
     * @type {Router}
     */
    return Router;
};

module.exports = RouterFactory;