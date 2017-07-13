/**
 * This file contains a simple helper to do requests to localhost
 * Its meant to be used on the example files for test purposes
 */
let request = require('request');

/**
 * Main function to the request
 * @method selfRequest
 * @param  {String}    path
 * @param  {String}    [method='get']
 * @param  {Object}    [data={}]
 * @return {Promise}
 */
let selfRequest = (path, method = 'get', data = {}) => {
    return new Promise((resolve, reject) => {
        let options = {
            url: 'http://localhost:3000' + path,
            form: data
        };
        request[method](options, (err, response, body) => {
            if (err) {
                return reject(err);
            }

            console.log('Response -> ', body);
            console.log('');
            resolve(body);
        });
    });
}

module.exports = selfRequest;
