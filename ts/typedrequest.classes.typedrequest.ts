import * as plugins from './typedrequest.plugins';
import { TypedResponseError } from './typedrequest.classes.typedresponseerror';
import { TypedRouter } from './typedrequest.classes.typedrouter';

export type IPostMethod = (
  typedRequestPostObject: plugins.typedRequestInterfaces.ITypedRequest
) => void | Promise<plugins.typedRequestInterfaces.ITypedRequest>;

export class TypedRequest<T extends plugins.typedRequestInterfaces.ITypedRequest> {
  public typedRouterRef: TypedRouter;
  public webrequest = new plugins.webrequest.WebRequest();

  /**
   * in case we post against a url endpoint
   */
  public urlEndPoint?: string;

  /**
   * in case we post with some other method, ec ipc communication
   */
  public postMethod?: IPostMethod;
  public method: string;

  // STATIC
  constructor(
    postEndPointArg: string | IPostMethod,
    methodArg: T['method'],
    typedrouterRefArg?: TypedRouter
  ) {
    if (typeof postEndPointArg === 'string') {
      this.urlEndPoint = postEndPointArg;
    } else {
      this.postMethod = postEndPointArg;
    }
    this.method = methodArg;
    this.typedRouterRef = typedrouterRefArg;
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
      const response = await this.webrequest.postJson(this.urlEndPoint, payload);
      responseBody = response;
    } else {
      let responseInterest: plugins.lik.Interest<
          string,
          plugins.typedRequestInterfaces.ITypedRequest
      >;
      if (this.typedRouterRef) {
        responseInterest = await this.typedRouterRef.fireEventInterestMap.addInterest(
          payload.correlation.id,
          payload
        );
      }
      const postMethodReturnValue = await this.postMethod(payload);
      if (responseInterest) {
        responseBody = await responseInterest.interestFullfilled;
      } else if (postMethodReturnValue) {
        responseBody = postMethodReturnValue;
      } else {
        responseBody = payload;
      }
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
