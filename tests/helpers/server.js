const request = require('request');

module.exports = (server) => {
  let port = Math.floor(Math.random() * (3999 - 3001)) + 3000;

  return {
    port,
    async start({ log }) {
      await new Promise((resolve) => {
        server.listen(port, () => {
          log(`Micro listening on port ${port}`);
          resolve();
        });
      });
    },
    async close() {
      server.close();
    },
    request(path, method = 'get', data = {}) {
      return new Promise((resolve, reject) => {
        let options = {
          url: `http://localhost:${port}${path}`,
          form: data
        };
        request[method](options, (err, res, body) => {
          if (err) {
            return reject(err);
          }

          resolve({ res, body });
        });
      });
    }
  };
};
