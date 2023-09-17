import middy from '@middy/core';
import validator from '@middy/validator';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';

class RequestMiddleware {
  protected middyMiddleware = (handler: any, validationSchema?: any) =>
    validationSchema
      ? middy(handler)
          .use([jsonBodyParser(), httpEventNormalizer(), validator({ eventSchema: validationSchema })])
          .use({
            onError: (request) => {
              const response = request.response;
              const error = <any>request.error;
              if (response.statusCode != 400) {
                return;
              }
              if (!error.expose || !error.cause) {
                return;
              }
              response.headers['Content-Type'] = 'application/json';
              response.body = JSON.stringify({ message: response.body, validationErrors: error.cause });
            },
          })
          .use(httpErrorHandler())
      : middy(handler).use([jsonBodyParser(), httpEventNormalizer(), httpErrorHandler()]);

  public handle(handler: any, validationSchema?: any): any {
    return this.middyMiddleware(handler, validationSchema);
  }
}

export default new RequestMiddleware();
