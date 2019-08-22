import * as plugins from './typedrequest.plugins';

export class TypedRequest<T extends plugins.typedRequestInterfaces.ITypedRequest> {
  public urlEndPoint: string;
  public method: string;

  // STATIC
  constructor(urlEndPointArg: string, methodArg: T['method']) {
    this.urlEndPoint = urlEndPointArg;
    this.method = methodArg;
  };

  /**
   * firest the request
   */
  public async fire(fireArg: T['request']): Promise<T['response']> {
    const response = await plugins.smartrequest.request(this.urlEndPoint, {
      method: 'POST',
      requestBody: {
        method: this.method,
        request: fireArg,
        response: null
      } 
    });
    return response.body.response;
  }
}