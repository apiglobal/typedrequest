import { expect, tap } from '@pushrocks/tapbundle';
import * as smartexpress from '@pushrocks/smartexpress';

import * as typedrequest from '../ts/index';

let testServer: smartexpress.Server;

tap.test('should spawn a server to test with', async () => {
  testServer = new smartexpress.Server({
    cors: true,
    forceSsl: false,
    port: 3000
  });
});

tap.test('should define a testHandler', async () => {

});

tap.test('should start the server', async () => {
  await testServer.start();
});

tap.test('should end the server', async () => {
  await testServer.stop();
});

tap.start();
