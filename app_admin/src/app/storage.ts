import { InjectionToken } from '@angular/core';

// Injection token that hands components and services the browser's
// localStorage. Injecting it rather than reaching for the global directly
// keeps the dependency explicit and makes it swappable later.
//
// We store the JWT in localStorage rather than a cookie because the server
// returns the token in the response body, so the browser cannot manage it for
// us automatically. That choice avoids CSRF exposure at the cost of remaining
// vulnerable to script injection (XSS), and it means the application has to
// attach the token to outgoing requests itself. That is the interceptor's job.
//
// DEVIATION FROM GUIDE (page 202): the guide also declares an empty
// "export class Storage {}" at the bottom of this file. TypeScript hoists type
// declarations, so inside that file the name Storage resolves to the empty
// local class rather than the DOM's Storage interface. It compiles only
// because an empty class is structurally permissive and therefore compatible
// with anything. Omitting it makes Storage unambiguously the DOM type
// everywhere, and removes a trap where importing Storage from '../storage' in
// a consumer would silently break calls to getItem and setItem.
export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
    providedIn: 'root',
    factory: () => localStorage
});