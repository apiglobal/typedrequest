import * as plugins from './typedrequest.plugins';

import { TypedHandler } from './typedrequest.classes.typedhandler';

/**
 * A typed router decides on which typed handler to call based on the method
 * specified in the typed request
 * This is thought for reusing the same url endpoint for different methods
 */
export class TypedRouter {
  public handlerMap = new plugins.lik.Objectmap<
    TypedHandler<plugins.typedRequestInterfaces.ITypedRequest>
  >();

  /**
   * adds the handler to the routing map
   * @param handlerArg
   */
  public addTypedHandler<T extends plugins.typedRequestInterfaces.ITypedRequest>(handlerArg: TypedHandler<T>) {
    this.handlerMap.add(handlerArg);
  }

  public async addResponse(typedRequest: plugins.typedRequestInterfaces.ITypedRequest) {
    const typedHandler = this.handlerMap.find(handler => {
      return handler.method === typedRequest.method;
    });

    typedRequest = await typedHandler.addResponse(typedRequest);
    return typedRequest;
  }
}
