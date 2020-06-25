import * as plugins from './typedrequest.plugins';
import { TypedResponseError } from './typedrequest.classes.typedresponseerror';

export class TypedRequest<T extends plugins.typedRequestInterfaces.ITypedRequest> {
  public webrequest = new plugins.webrequest.WebRequest();
  public urlEndPoint: string;
  public method: string;

  // STATIC
  constructor(urlEndPointArg: string, methodArg: T['method']) {
    this.urlEndPoint = urlEndPointArg;
    this.method = methodArg;
  }

  /**
   * firest the request
   */
  public async fire(fireArg: T['request']): Promise<T['response']> {
    const response = await this.webrequest.postJson(this.urlEndPoint, {
      method: this.method,
      request: fireArg,
      response: null
    });
    const responseBody: T = response;
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
