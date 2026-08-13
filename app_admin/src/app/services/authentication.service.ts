import { Inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { TripDataService } from './trip-data.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  // Storage gives us somewhere persistent to keep the JWT; TripDataService
  // gives us the /login and /register endpoints to talk to.
  constructor(
    @Inject(BROWSER_STORAGE) private storage: Storage,
    private tripDataService: TripDataService
  ) { }

  // Variable to handle Authentication Responses
  authResp: AuthResponse = new AuthResponse();

  // Get our token from our Storage provider.
  // NOTE: For this application we have decided that we will name
  // the key for our token 'travlr-token'
  public getToken(): string {
    let out: any;
    out = this.storage.getItem('travlr-token');

    // Make sure we return a string even if we don't have a token
    if (!out) {
      return '';
    }
    return out;
  }

  // Save our token to our Storage provider.
  public saveToken(token: string): void {
    this.storage.setItem('travlr-token', token);
  }

  // Logout of our application and remove the JWT from Storage. The user has
  // to authenticate again before the protected endpoints will accept them.
  public logout(): void {
    this.storage.removeItem('travlr-token');
  }

  // Are we logged in with a token that has not yet expired? Holding a token
  // is not enough on its own, since it stops being accepted after an hour.
  //
  // DEVIATION FROM GUIDE (page 205): the guide calls
  // JSON.parse(atob(token.split('.')[1])) with no guard. Anything malformed in
  // localStorage makes that throw. This method runs from the navbar and from
  // every trip card on every change detection cycle, so a single corrupted
  // entry would take down the whole admin UI with no obvious cause. Catching
  // it, clearing the bad token, and reporting "not logged in" fails closed and
  // self-heals.
  public isLoggedIn(): boolean {
    const token: string = this.getToken();

    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > (Date.now() / 1000);
    } catch (err) {
      console.log('Discarding an unreadable token from storage.');
      this.logout();
      return false;
    }
  }

  // Retrieve the current user. Call isLoggedIn() first; the guard below stops
  // this from throwing if you forget, but an empty User is not useful data.
  public getCurrentUser(): User {
    const token: string = this.getToken();

    if (!token) {
      return new User();
    }

    try {
      const { email, name } = JSON.parse(atob(token.split('.')[1]));
      return { email, name } as User;
    } catch (err) {
      return new User();
    }
  }

  // Log in and hand the caller the Observable so it can react to the outcome.
  // The token is saved as a side effect via tap, so callers that only care
  // about success or failure do not have to know about storage at all.
  //
  // DEVIATION FROM GUIDE (pages 206 and 213-214): the guide's login() returns
  // void and subscribes internally, which leaves the component no way to learn
  // whether the call succeeded, failed, or is still in flight. The guide works
  // around that in doLogin() by checking isLoggedIn(), then waiting three
  // seconds on a setTimeout and checking again. Two consequences follow. A
  // wrong password produces no feedback whatsoever: no message, no error, the
  // user simply stays on the form with no idea why. And a response slower than
  // three seconds strands the user even though the login worked.
  //
  // Returning the Observable lets the component subscribe, navigate the moment
  // the token arrives, and render a real message on failure. No timer needed.
  public login(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService.login(user, passwd)
      .pipe(
        tap((authResp: AuthResponse) => {
          if (authResp && authResp.token) {
            this.authResp = authResp;
            this.saveToken(authResp.token);
          }
        })
      );
  }

  // Register a new user. The API logs them in immediately and returns a token
  // the same way login does, so the handling is identical.
  public register(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService.register(user, passwd)
      .pipe(
        tap((authResp: AuthResponse) => {
          if (authResp && authResp.token) {
            this.authResp = authResp;
            this.saveToken(authResp.token);
          }
        })
      );
  }
}