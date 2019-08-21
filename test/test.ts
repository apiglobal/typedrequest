import { expect, tap } from '@pushrocks/tapbundle';
import * as typedrequest from '../ts/index';

tap.test('first test', async () => {
  console.log(typedrequest.standardExport);
});

tap.start();
