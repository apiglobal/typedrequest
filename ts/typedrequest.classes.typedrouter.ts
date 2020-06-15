import * as plugins from './typedrequest.plugins';

import { TypedHandler } from './typedrequest.classes.typedhandler';

/**
 * A typed router decides on which typed handler to call based on the method
 * specified in the typed request
 * This is thought for reusing the same url endpoint for different methods
 */
export class TypedRouter {
  public upstreamTypedRouter: TypedRouter;

  public routerMap = new plugins.lik.ObjectMap<TypedRouter>();

  public handlerMap = new plugins.lik.ObjectMap<
    TypedHandler<plugins.typedRequestInterfaces.ITypedRequest>
  >();

  /**
   * adds the handler to the routing map
   * @param typedHandlerArg
   */
  public addTypedHandler<T extends plugins.typedRequestInterfaces.ITypedRequest>(
    typedHandlerArg: TypedHandler<T>
  ) {
    // lets check for deduplication
    const existingTypedHandler = this.getTypedHandlerForMethod(typedHandlerArg.method);
    if (existingTypedHandler) {
      throw new Error(
        `a TypedHandler for ${typedHandlerArg.method} alredy exists! Can't add another one.`
      );
    }

    this.handlerMap.add(typedHandlerArg);
  }

  /**
   * adds another sub typedRouter
   * @param typedRequest
   */
  public addTypedRouter(typedRouterArg: TypedRouter) {
    this.routerMap.add(typedRouterArg);
  }

  public setUpstreamTypedRouter(typedRouterArg: TypedRouter) {
    this.upstreamTypedRouter = typedRouterArg;
  }

  public checkForTypedHandler(methodArg: string): boolean {
    return !!this.getTypedHandlerForMethod(methodArg);
  }

  /**
   * gets a typed Router from the router chain, upstream and downstream
   * @param methodArg
   * @param checkUpstreamRouter
   */
  public getTypedHandlerForMethod(
    methodArg: string,
    checkUpstreamRouter = true
  ): TypedHandler<any> {
    let typedHandler: TypedHandler<any>;

    if (this.upstreamTypedRouter && checkUpstreamRouter) {
      typedHandler = this.upstreamTypedRouter.getTypedHandlerForMethod(methodArg);
    } else {
      typedHandler = this.handlerMap.find(handler => {
        return handler.method === methodArg;
      });

      if (!typedHandler) {
        this.routerMap.getArray().forEach(typedRouter => {
          if (!typedHandler) {
            typedHandler = typedRouter.getTypedHandlerForMethod(methodArg, false);
          }
        });
      }
    }

    return typedHandler;
  }

  /**
   * routes a typed request to a handler
   * @param typedRequestArg
   */
  public async routeAndAddResponse(typedRequestArg: plugins.typedRequestInterfaces.ITypedRequest) {
    const typedHandler = this.getTypedHandlerForMethod(typedRequestArg.method);

    if (!typedHandler) {
      const availableMethods: string[] = [];
      await this.handlerMap.forEach(async handler => {
        availableMethods.push(handler.method);
      });
      console.log(`Cannot find method for ${typedHandler}`);
      console.log(`Available methods are:`);
      console.log(availableMethods);
      typedRequestArg.error = {
        text: 'There is no available method for this call on the server side',
        data: {}
      };
      return typedRequestArg;
    }

    typedRequestArg = await typedHandler.addResponse(typedRequestArg);
    return typedRequestArg;
  }
}
