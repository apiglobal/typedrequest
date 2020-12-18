import * as plugins from './typedrequest.plugins';
import { TypedResponseError } from './typedrequest.classes.typedresponseerror';
import { TypedRouter } from './typedrequest.classes.typedrouter';
import { TypedTarget } from './typedrequest.classes.typedtarget';

const webrequestInstance = new plugins.webrequest.WebRequest();

export class TypedRequest<T extends plugins.typedRequestInterfaces.ITypedRequest> {


  /**
   * in case we post against a url endpoint
   */
  public urlEndPoint?: string;

  /**
   * in case we post against a TypedTarget
   */
  typedTarget: TypedTarget;

  public method: string;

  /**
   * note the overloading is thought to deak with promises
   * @param postEndPointArg
   * @param methodArg 
   */
  constructor(postTarget: string | TypedTarget, methodArg: T['method']) {
    if (typeof postTarget === 'string') {
      this.urlEndPoint = postTarget;
    } else {
      this.typedTarget = postTarget;
    }
    this.method = methodArg;
  }

  /**
   * fires the request
   */
  public async fire(fireArg: T['request']): Promise<T['response']> {
    const payload: plugins.typedRequestInterfaces.ITypedRequest = {
      method: this.method,
      request: fireArg,
      response: null,
      correlation: {
        id: plugins.isounique.uni(),
        phase: 'request',
      },
    };

    let responseBody: plugins.typedRequestInterfaces.ITypedRequest;
    if (this.urlEndPoint) {
      const response = await webrequestInstance.postJson(this.urlEndPoint, payload);
      responseBody = response;
    } else {
      responseBody = await this.typedTarget.post(payload);
    }
    if (responseBody.error) {
      console.error(
        `Got an error ${responseBody.error.text} with data ${JSON.stringify(
          responseBody.error.data
        )}`
      );
      if (!responseBody.retry) {
        throw new TypedResponseError(responseBody.error.text, responseBody.error.data);
      }
      return null;
    }
    if (responseBody.retry) {
      console.log(`server requested retry for the following reason: ${responseBody.retry.reason}`);
      await plugins.smartdelay.delayFor(responseBody.retry.waitForMs);
      // tslint:disable-next-line: no-return-await
      return await this.fire(fireArg);
    }
    return responseBody.response;
  }
}
