import * as plugins from './typedrequest.plugins';

export class TypedRequest<T extends plugins.typedRequestInterfaces.ITypedRequest> {
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
    const response = await plugins.smartrequest.postJson(this.urlEndPoint, {
      requestBody: {
        method: this.method,
        request: fireArg,
        response: null
      }
    });
    const responseBody: T = response.body;
    if (responseBody.error) {
      console.log(responseBody.error.text);
      console.log(responseBody.error.data);
      return null;
    }
    if (responseBody.retry) {
      console.log('server requested retry');
    };
    return responseBody.response;
  }
}
