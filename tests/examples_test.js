const test = require('ava');
const expect = require('expect');
const ServerHelper = require('./helpers/server');
const CompressionExample = require('../examples/compression');
const ExpressPluginsExample = require('../examples/express-plugins');
const MixedExample = require('../examples/mixed');
const SimpleExample = require('../examples/simple');
const SubRoutersExample = require('../examples/sub-router');
const UseMiddlewaresExample = require('../examples/use-middlewares');
const ServeFilesExample = require('../examples/serve-files');

test('should test nodejs plugins', async (t) => {
  let Server = ServerHelper(CompressionExample);
  await Server.start(t);
  let { body } = await Server.request('/');
  t.is(body, 'Welcome to micro');
  await Server.close(t);
});

test('should test express plugins', async (t) => {
  let Server = ServerHelper(ExpressPluginsExample);
  await Server.start(t);
  let { body } = await Server.request('/');
  t.is(body, 'Welcome to micro');
  await Server.close(t);
});

test('should test mixed middlewares', async (t) => {
  let Server = ServerHelper(MixedExample);
  await Server.start(t);

  // Known url
  let res = await Server.request('/url/ok');
  t.is(res.body, 'This is the final response');

  // Not known url
  res = await Server.request('/hello/mike');
  t.is(res.body, 'Not found');

  await Server.close(t);
});

test('should test simple example', async (t) => {
  let Server = ServerHelper(SimpleExample);
  await Server.start(t);
  let res;

  // Home url
  res = await Server.request('/');
  t.is(res.body, 'Welcome to micro');

  // Parametrized path
  res = await Server.request('/hello/mike');
  t.is(res.body, JSON.stringify({ message: 'Hello mike' }));

  // Sequenced middlewares
  res = await Server.request('/hello/mike/whats/up');
  t.is(res.body, JSON.stringify({ message: 'Hello mike whats up' }));

  // Default parsed body for all methods other than get
  res = await Server.request('/hello', 'post', { hello: 'world' });
  t.is(res.body, JSON.stringify({ hello: 'world' }));

  // Default parsed query parameters
  res = await Server.request('/hello/with/params?hello=world');
  t.is(res.body, JSON.stringify({ hello: 'world' }));

  await Server.close(t);
});

test('should test use of subrouters', async (t) => {
  let Server = ServerHelper(SubRoutersExample);
  await Server.start(t);

  // Subrouter home url
  let res = await Server.request('/hello/mike');
  t.is(res.body, 'Hello mike');

  // Subrouter parametrized url
  res = await Server.request('/hello/mike/from/usa');
  t.is(res.body, 'Hello mike from usa');

  await Server.close(t);
});

test('should test use middlewares', async (t) => {
  let Server = ServerHelper(UseMiddlewaresExample);
  await Server.start(t);

  // Known url
  let res = await Server.request('/url/ok');
  t.is(res.body, 'ok');

  // Not known url
  res = await Server.request('/hello/mike');
  t.is(res.body, 'Not found');

  await Server.close(t);
});

test('should test files server', async (t) => {
  let Server = ServerHelper(ServeFilesExample);
  await Server.start(t);
  let result;

  // File from directory
  result = await Server.request('/compression.js');
  t.log(result.body);
  expect(result.res.headers).toEqual(
    expect.objectContaining({
      'cache-control': 'public, max-age=2592000',
      connection: 'close',
      'content-length': '560',
      'content-type': 'application/javascript'
    })
  );

  // Direct file serve
  result = await Server.request('/file/compression.js');
  expect(result.res.headers).toEqual(
    expect.objectContaining({
      'cache-control': 'public, max-age=2592000',
      connection: 'close',
      'content-length': '560',
      'content-type': 'application/javascript'
    })
  );

  // Render html string
  result = await Server.request('/render/html');
  t.is(result.body, '<html><body>Hello world</body></html>');
  expect(result.res.headers).toEqual(
    expect.objectContaining({
      'cache-control': 'public, no-cache, no-store, must-revalidate',
      connection: 'close',
      'content-length': '37',
      'content-type': 'text/html; charset=utf-8',
      expires: '0',
      pragma: 'no-cache'
    })
  );

  // Render html with function
  result = await Server.request('/render/function');
  t.is(result.body, '<html><body>Hello world</body></html>');
  expect(result.res.headers).toEqual(
    expect.objectContaining({
      'cache-control': 'public, no-cache, no-store, must-revalidate',
      connection: 'close',
      'content-length': '37',
      'content-type': 'text/html; charset=utf-8',
      expires: '0',
      pragma: 'no-cache'
    })
  );

  // Render html with custom headers
  result = await Server.request('/render/headers');
  t.is(result.body, '<html><body>Hello world</body></html>');
  expect(result.res.headers).toEqual(
    expect.objectContaining({
      'cache-control': 'public, max-age=2592000',
      connection: 'close',
      'content-length': '37',
      'content-type': 'text/html; charset=utf-8',
      expires: '0',
      pragma: 'no-cache'
    })
  );

  await Server.close(t);
});
