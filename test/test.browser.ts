import { expect, tap } from '@pushrocks/tapbundle';

import * as typedrequest from '../ts/index';

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

tap.test('should define a testHandler', async () => {
  const testTypedRouter = new typedrequest.TypedRouter(); // typed routers can broker typedrequests between handlers
  testTypedRouter.addTypedHandler(testTypedHandler);
});

tap.test('should fire a request', async () => {
  const typedRequest = new typedrequest.TypedRequest<ITestReqRes>(
    'http://localhost:3000/testroute',
    'hi'
  );
});

tap.start();
