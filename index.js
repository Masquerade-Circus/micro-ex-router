
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
    let params = path.match(/:(\w+)?/gi);

    // Set the names of the params found
    if (Array.isArray(params)) {
        for (let i in params) {
            params[i] = params[i].replace(':', '');
        }
    }

    // Adds the path to the selected method
    router.paths[method][path] = {
        // RegExp that will be used to match against the requested path
        regexp : () => new RegExp('^' + path.replace(/:(\w+)/gi, "(\\w+)") + '/?$', 'gi'),
        // The name of the params if any
        params: params,
        // The middleware(s) to call when this path matches
        middleware: middleware
    };

    // return the pased router
    return router;
};


let RouterFactory = () => {

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
            let matches = urls[i].regexp().exec(req.url);
            if (Array.isArray(matches)) {
                matches.shift();
                req.params = {};
                for (let k in urls[i].params) {
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
                if (response !== undefined || res.headersSent) {
                    return response;
                }
            }

            // if middleware is an array of middlewares call them sequentially
            if (Array.isArray(middleware)) {
                let l = middleware.length, i = 0;
                // call sequentially every middleware
                for (; i < l; i++) {
                    response = await middleware[i](req, res);
                    if (response !== undefined || res.headersSent) {
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
     * Return the new router
     * @type {Router}
     */
    return Router;
};

module.exports = RouterFactory;
