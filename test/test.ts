import { expect, tap } from '@pushrocks/tapbundle';
import * as smartexpress from '@pushrocks/smartexpress';

import * as typedrequest from '../ts/index.js';

let testServer: smartexpress.Server;
let testTypedHandler: typedrequest.TypedHandler<ITestReqRes>;

// lets define an interface
interface ITestReqRes {
  method: 'hi';
  request: {
    name: string;
  };
  response: {
    surname: string;
  };
}

tap.test('should create a typedHandler', async () => {
  // lets use the interface in a TypedHandler
  testTypedHandler = new typedrequest.TypedHandler<ITestReqRes>('hi', async (reqArg) => {
    return {
      surname: 'wow',
    };
  });
});

tap.test('should spawn a server to test with', async () => {
  testServer = new smartexpress.Server({
    cors: true,
    forceSsl: false,
    port: 3000,
  });
});

tap.test('should define a testHandler', async () => {
  const testTypedRouter = new typedrequest.TypedRouter(); // typed routers can broker typedrequests between handlers
  testTypedRouter.addTypedHandler(testTypedHandler);
  testServer.addRoute(
    '/testroute',
    new smartexpress.HandlerTypedRouter(testTypedRouter as any) // the "any" is testspecific, since smartexpress ships with its own version of typedrequest.
  );
});

tap.test('should start the server', async () => {
  await testServer.start();
});

tap.test('should fire a request', async () => {
  const typedRequest = new typedrequest.TypedRequest<ITestReqRes>(
    'http://localhost:3000/testroute',
    'hi'
  );
  const response = await typedRequest.fire({
    name: 'really',
  });
  console.log('this is the response:');
  console.log(response);
  expect(response.surname).toEqual('wow');
});

tap.test('should end the server', async () => {
  await testServer.stop();
});

tap.start();
