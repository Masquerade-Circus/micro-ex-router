let fs = require('fs');
let recursive = require('recursive-readdir');

let HEADERS = {
  ContentType: 'Content-Type',
  ContentLength: 'Content-Length',
  CacheControl: 'Cache-Control'
};

let defaultRefreshFileListTime = 1000 * 60 * 60; // 60 minutes

/**
 * Mime types to set to the served files
 * @type {Object}
 */
let mimeTypes = {
  aac: 'audio/aac',
  abw: 'application/x-abiword',
  arc: 'application/octet-stream',
  avi: 'video/x-msvideo',
  azw: 'application/vnd.amazon.ebook',
  bin: 'application/octet-stream',
  bz: 'application/x-bzip',
  bz2: 'application/x-bzip2',
  csh: 'application/x-csh',
  css: 'text/css',
  csv: 'text/csv',
  doc: 'application/msword',
  epub: 'application/epub+zip',
  gif: 'image/gif',
  htm: 'text/html',
  html: 'text/html; charset=utf-8',
  ico: 'image/x-icon',
  ics: 'text/calendar',
  jar: 'application/java-archive',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'application/javascript',
  json: 'application/json',
  mid: 'audio/midi',
  midi: 'audio/midi',
  mpeg: 'video/mpeg',
  mpkg: 'application/vnd.apple.installer+xml',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odt: 'application/vnd.oasis.opendocument.text',
  oga: 'audio/ogg',
  ogv: 'video/ogg',
  ogx: 'application/ogg',
  pdf: 'application/pdf',
  png: 'image/png',
  ppt: 'application/vnd.ms-powerpoint',
  rar: 'application/x-rar-compressed',
  rtf: 'application/rtf',
  sh: 'application/x-sh',
  svg: 'image/svg+xml',
  swf: 'application/x-shockwave-flash',
  tar: 'application/x-tar',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  ttf: 'font/ttf',
  vsd: 'application/vnd.visio',
  wav: 'audio/x-wav',
  weba: 'audio/webm',
  webm: 'video/webm',
  webp: 'image/webp',
  woff: 'font/woff',
  woff2: 'font/woff2',
  xhtml: 'application/xhtml+xml',
  xls: 'application/vnd.ms-excel',
  xml: 'application/xml',
  xul: 'application/vnd.mozilla.xul+xml',
  zip: 'application/zip',
  '3gp': 'video/3gpp',
  '3g2': 'video/3gpp2',
  '7z': 'application/x-7z-compressed'
};

/**
 * @description Helper function to serve a file from the file system
 * @method serveFile
 * @param  {Object}  res        Response object
 * @param  {String}  filePath   Path of the file to serve
 * @param  {Object}  headers    Object with custom headers by extension
 * @return {Promise} Promise that resolves with the stream
 */
let serveFile = (res, filePath, headers = {}) => {
  let extension = filePath
    .split('/')
    .pop()
    .split('.')
    .pop();
  return new Promise((resolve, reject) => {
    return fs.stat(filePath, (err, stat) => {
      if (err) {
        return reject(err);
      }

      if (extension === 'html') {
        res.writeHead(200, {
          [HEADERS.ContentType]: mimeTypes[extension] || 'text/plain',
          [HEADERS.ContentLength]: stat.size,
          [HEADERS.CacheControl]: 'public, no-cache, no-store, must-revalidate',
          Expires: '0',
          Pragma: 'no-cache',
          ...headers.any,
          ...headers[extension]
        });
      } else {
        res.writeHead(200, {
          [HEADERS.ContentType]: mimeTypes[extension] || 'text/plain',
          [HEADERS.ContentLength]: stat.size,
          [HEADERS.CacheControl]: 'public, max-age=2592000',
          Expires: new Date(Date.now() + 604800000).toUTCString(),
          Pragma: 'no-cache',
          ...headers.any,
          ...headers[extension]
        });
      }

      let readStream = fs.createReadStream(filePath);

      resolve(readStream.pipe(res));
    });
  });
};

function getFileList(dir) {
  let dirName = dir.replace('./', '');
  let fileList = {};
  recursive(dir, function (err, files) {
    if (err) {
      return console.log(err);
    }

    files.forEach((file) => {
      file = file.replace(/\\/gi, '/');
      let path = file.replace(dirName, '');
      let regexpPath = path
        // To set to any url with the path as prefix
        .replace(/\*/g, '.*')
        // Remove the last slash
        .replace(/\/(\?.*)?$/gi, '$1');

      fileList[file.replace(dirName, '')] = {
        file: './' + file,
        regexp: new RegExp('^' + regexpPath + '\\?.*?$', 'gi')
      };
    });
  });

  return fileList;
}

let serveDir = function (dir, headers = {}, refreshFileListTime = defaultRefreshFileListTime) {
  let fileList = getFileList(dir);
  let oldTimestamp = Date.now();

  return async (req, res) => {
    let newTimestamp = Date.now();

    if (newTimestamp > oldTimestamp + refreshFileListTime) {
      oldTimestamp = newTimestamp;
      fileList = await getFileList(dir);
    }

    if (fileList[req.url]) {
      return serveFile(res, fileList[req.url].file, headers);
    }

    for (let i in fileList) {
      let matches = fileList[i].regexp.exec(req.url);
      fileList[i].regexp.lastIndex = -1;
      if (Array.isArray(matches)) {
        return serveFile(res, fileList[i].file, headers);
      }
    }
  };
};

/**
 * @description Helper function to render an html string
 * @method render
 * @param  {Object} htmlOrFunc     Html string or method returning an html string
 * @param  {Object} headers    Headers object to add to the response
 * @return {Function} Middleware function to pass to express/micro
 */
let render = (htmlOrFunc, headers = {}) => {
  return async (req, res) => {
    let html;
    if (typeof htmlOrFunc === 'function') {
      html = await htmlOrFunc(req, res);
    }

    if (typeof htmlOrFunc === 'string') {
      html = htmlOrFunc;
    }

    res.writeHead(
      200,
      {
        [HEADERS.ContentType]: mimeTypes.html,
        [HEADERS.ContentLength]: html.length,
        [HEADERS.CacheControl]: 'public, no-cache, no-store, must-revalidate',
        Expires: '0',
        Pragma: 'no-cache',
        ...headers
      }
    );

    res.end(html);
  };
};

module.exports = {
  serveFile,
  serveDir,
  render
};
