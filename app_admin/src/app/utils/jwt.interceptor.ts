import { Injectable, Provider } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { HttpInterceptor, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authentication.service';

// An Interceptor sits in the HTTP pipeline, gets handed every outbound
// request, and can modify it before passing it along. Attaching the JWT is a
// textbook cross-cutting concern: every protected endpoint needs the same
// header, and without an interceptor we would be editing trip-data.service.ts
// every single time the API grew a new method. This way the logic lives in
// one file and applies everywhere automatically.
//
// NOTE ON GENERATION: the Angular 17 CLI generates a *functional* interceptor
// (HttpInterceptorFn) by default. This file is the class-based form the guide
// uses, which pairs with withInterceptorsFromDi() in app.config.ts.
@Injectable()
export class JwtInterceptor implements HttpInterceptor {

  constructor(
    private authenticationService: AuthenticationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    // The login and register endpoints are how you GET a token, so they must
    // not have one attached. Sending a stale or expired token to /login would
    // be meaningless at best.
    //
    // DEVIATION FROM GUIDE (page 219): the guide tests
    // request.url.startsWith('login'), but request.url is the full absolute
    // URL, 'http://localhost:3000/api/login'. That test is therefore always
    // false and the exclusion never fires, so the guide's interceptor attaches
    // an Authorization header to login and register requests anyway. Harmless
    // in practice, since those routes are unprotected, but the check does
    // nothing at all. Matching the end of the path is what was intended.
    const isAuthAPI: boolean =
      request.url.endsWith('/login') || request.url.endsWith('/register');

    if (this.authenticationService.isLoggedIn() && !isAuthAPI) {
      const token = this.authenticationService.getToken();

      // HttpRequest objects are immutable, so we clone with the extra header
      // rather than mutating the original.
      const authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next.handle(authReq);
    }

    // Not logged in, or this is an auth endpoint: pass it through untouched.
    return next.handle(request);
  }
}

// Provider pulled into app.config.ts to register this class in the pipeline.
// multi: true because HTTP_INTERCEPTORS is a multi-provider token; several
// interceptors can be chained.
export const authInterceptProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: JwtInterceptor,
  multi: true
};