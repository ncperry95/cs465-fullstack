import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptProvider } from './utils/jwt.interceptor';

// DEVIATION FROM GUIDE (page 220): the guide adds HttpClientModule and
// importProvidersFrom, and notes they "will get a line through them and show
// as deprecated, but they are still needed in the project". They are not.
// withInterceptorsFromDi() is the supported way to tell provideHttpClient to
// honour class-based HTTP_INTERCEPTORS providers, and it does the same job
// with no deprecation warnings.
//
// Worth knowing why this line matters: a bare provideHttpClient() does NOT
// read HTTP_INTERCEPTORS from DI. Register the interceptor without it and it
// silently never runs. Nothing errors, nothing warns, and every protected
// request keeps failing with a 401 while the code looks correct.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    authInterceptProvider
  ]
};