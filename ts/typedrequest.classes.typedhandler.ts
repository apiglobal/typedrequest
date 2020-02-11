import * as plugins from './typedrequest.plugins';

type THandlerFunction<T extends plugins.typedRequestInterfaces.ITypedRequest> = (
  requestArg: T['request']
) => Promise<T['response']>;

/**
 * typed handler for dealing with typed requests
 */
export class TypedHandler<T extends plugins.typedRequestInterfaces.ITypedRequest> {
  public method: string;
  private handlerFunction: THandlerFunction<T>;

  constructor(methodArg: T['method'], handlerFunctionArg: THandlerFunction<T>) {
    this.method = methodArg;
    this.handlerFunction = handlerFunctionArg;
  }

  /**
   * adds a response to the typedRequest
   * @param typedRequestArg
   */
  public async addResponse(typedRequestArg: T) {
    if (typedRequestArg.method !== this.method) {
      throw new Error(
        'this handler has been given a wrong method to answer to. Please use a TypedRouter to filter requests'
      );
    }
    const response = await this.handlerFunction(typedRequestArg.request);
    typedRequestArg.response = response;
    return typedRequestArg;
  }
}
