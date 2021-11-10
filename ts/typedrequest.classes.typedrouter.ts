import * as plugins from './typedrequest.plugins';

import { TypedHandler } from './typedrequest.classes.typedhandler';
import { TypedRequest } from './typedrequest.classes.typedrequest';

/**
 * A typed router decides on which typed handler to call based on the method
 * specified in the typed request
 * This is thought for reusing the same url endpoint for different methods
 */
export class TypedRouter {
  public routerMap = new plugins.lik.ObjectMap<TypedRouter>();
  public handlerMap = new plugins.lik.ObjectMap<
    TypedHandler<any & plugins.typedRequestInterfaces.ITypedRequest>
  >();

  public fireEventInterestMap = new plugins.lik.InterestMap<
    string,
    plugins.typedRequestInterfaces.ITypedRequest
  >((correlationId: string) => correlationId);

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
    const routerExists = this.routerMap.findSync(routerArg => routerArg === typedRouterArg)
    if (!routerExists) {
      this.routerMap.add(typedRouterArg);
      typedRouterArg.addTypedRouter(this);
    }
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
    checkedRouters: TypedRouter[] = []
  ): TypedHandler<any> {
    checkedRouters.push(this);

    let typedHandler: TypedHandler<any>;

    typedHandler = this.handlerMap.findSync((handler) => {
      return handler.method === methodArg;
    });
    
    if (!typedHandler) {
      this.routerMap.getArray().forEach((typedRouterArg) => {
        if (!typedHandler && !checkedRouters.includes(typedRouterArg)) {
          typedHandler = typedRouterArg.getTypedHandlerForMethod(methodArg, checkedRouters);
        }
      });
    }

    return typedHandler;
  }

  /**
   * if typedrequest object has correlation.phase === 'request' -> routes a typed request object to a handler
   * if typedrequest object has correlation.phase === 'response' -> routes a typed request object to request fire event
   * @param typedRequestArg
   */
  public async routeAndAddResponse<T extends plugins.typedRequestInterfaces.ITypedRequest = any>(typedRequestArg: T): Promise<T> {
    if (!typedRequestArg?.correlation?.phase || typedRequestArg.correlation.phase === 'request') {
      const typedHandler = this.getTypedHandlerForMethod(typedRequestArg.method);

      if (!typedHandler) {
        console.log(`Cannot find handler for methodname ${typedRequestArg.method}`);
        typedRequestArg.error = {
          text: 'There is no available method for this call on the server side',
          data: {},
        };
        return typedRequestArg;
      }

      typedRequestArg = await typedHandler.addResponse(typedRequestArg);
    } else if (typedRequestArg.correlation.phase === 'response') {
      this.fireEventInterestMap
        .findInterest(typedRequestArg.correlation.id)
        ?.fullfillInterest(typedRequestArg);
    } else {
      console.log('received weirdly shaped request');
      console.log(typedRequestArg);
      return null
    }
    return typedRequestArg;
  }
}
