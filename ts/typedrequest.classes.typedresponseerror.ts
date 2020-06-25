import * as plugins from './typedrequest.plugins';

export class TypedResponseError {
  public errorText: string;
  public errorData: any;
  constructor(errorTextArg: string, errorDataArg?: any) {
    this.errorText = errorTextArg;
    this.errorData = errorDataArg;
  }
}
