import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Trip } from '../models/trip';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { BROWSER_STORAGE } from '../storage';

@Injectable({
  providedIn: 'root'
})
export class TripDataService {

  constructor(
    private http: HttpClient,
    @Inject(BROWSER_STORAGE) private storage: Storage
  ) { }

  url = 'http://localhost:3000/api/trips';

  // Added in Module 7. The service is no longer limited to the trips
  // endpoint, so calls to /login and /register build off this instead.
  baseUrl = 'http://localhost:3000/api';

  getTrips() : Observable<Trip[]> {
    return this.http.get<Trip[]>(this.url);
  }

  addTrip(formData: Trip) : Observable<Trip> {
    return this.http.post<Trip>(this.url, formData);
  }

  getTrip(tripCode: string) : Observable<Trip[]> {
    return this.http.get<Trip[]>(this.url + '/' + tripCode);
  }

  updateTrip(formData: Trip) : Observable<Trip> {
    return this.http.put<Trip>(this.url + '/' + formData.code, formData);
  }

  // No guide equivalent. Added to satisfy the rubric's DELETE requirement.
  deleteTrip(tripCode: string) : Observable<Trip> {
    return this.http.delete<Trip>(this.url + '/' + tripCode);
  }

  // Call to our /login endpoint, returns JWT
  login(user: User, passwd: string) : Observable<AuthResponse> {
    return this.handleAuthAPICall('login', user, passwd);
  }

  // Call to our /register endpoint, creates user and returns JWT
  register(user: User, passwd: string) : Observable<AuthResponse> {
    return this.handleAuthAPICall('register', user, passwd);
  }

  // Helper shared by login and register. The two calls differ only in the
  // path, so the request-building logic is written and tested once.
  //
  // The password travels separately from the User object on purpose: it is
  // never a property of a User in this application, only an argument passed
  // through at the moment of authentication.
  handleAuthAPICall(endpoint: string, user: User, passwd: string) : Observable<AuthResponse> {
    let formData = {
      name: user.name,
      email: user.email,
      password: passwd
    };

    return this.http.post<AuthResponse>(this.baseUrl + '/' + endpoint, formData);
  }
}