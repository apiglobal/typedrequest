import { TypedRouter } from './typedrequest.classes.typedrouter';
import * as plugins from './typedrequest.plugins';

export type IPostMethod = (
  typedRequestPostObject: plugins.typedRequestInterfaces.ITypedRequest
) => Promise<plugins.typedRequestInterfaces.ITypedRequest>;

/**
 * enables the use of custom post functions
 * used for things like broadcast channels
 * e.g. @designestate/dees-comms
 * the main difference here is, that the response comes back async and is routed by interest through typedrouter
 */
export type IPostMethodWithTypedRouter = (
  typedRequestPostObject: plugins.typedRequestInterfaces.ITypedRequest
) => Promise<void> | Promise<plugins.typedRequestInterfaces.ITypedRequest>;

export interface ITypedTargetConstructorOptions {
  url?: string;
  postMethod?: IPostMethod;
  /**
   * a post method that does not return the answer
   */
  postMethodWithTypedRouter?: IPostMethodWithTypedRouter;
  /**
   * this typedrouter allows us to have easy async request response cycles
   */
  typedRouterRef?: TypedRouter;
}

/**
 * a typed target defines a target for requests
 */
export class TypedTarget {
  url: string;
  type: 'rest' | 'socket';
  options: ITypedTargetConstructorOptions;

  constructor(optionsArg: ITypedTargetConstructorOptions) {
    if (optionsArg.postMethodWithTypedRouter && !optionsArg.typedRouterRef) {
      throw new Error('you have to specify a typedrouter when using postmethod with typedrouter');
    }
    this.options = optionsArg;
  }

  /**
   * wether calls to this target are bound to the request/response cycle
   * if false, always delivers response as result of a call
   * if true, delivers response in a separate call
   * can only be async when type is 'socket'
   */
  public isAsync: boolean;

  public async post<T extends plugins.typedRequestInterfaces.ITypedRequest>(payloadArg: T): Promise<T> {
    let responseInterest: plugins.lik.Interest<
      string,
      plugins.typedRequestInterfaces.ITypedRequest
    >;
    // having a typedrouter allows us to work with async request response cycles.
    if (this.options.typedRouterRef) {
      responseInterest = await this.options.typedRouterRef.fireEventInterestMap.addInterest(
        payloadArg.correlation.id,
        payloadArg
      );
    }
    const postMethod = this.options.postMethod || this.options.postMethodWithTypedRouter;
    const postMethodReturnValue = await postMethod(payloadArg);
    let responseBody: T;
    if (responseInterest) {
      responseBody = (await responseInterest.interestFullfilled) as T;
    } else if (postMethodReturnValue) {
      responseBody = postMethodReturnValue as T;
    } else {
      responseBody = payloadArg;
    }
    return responseBody;
  }
}
