import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data.service';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trip-card.component.html',
  styleUrl: './trip-card.component.css'
})
export class TripCardComponent implements OnInit {

  @Input('trip') trip: any;

  // Lets the parent listing refresh itself after a successful delete,
  // rather than this component navigating away.
  @Output() tripDeleted = new EventEmitter<string>();

  constructor(
    private router: Router,
    private tripDataService: TripDataService,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {

  }

  // Delegates to the AuthenticationService so the template has one question
  // to ask. Drives whether the Edit and Delete buttons render at all.
  //
  // Note this is presentation only. Hiding a button stops an honest user from
  // clicking something that would fail; it stops nobody from calling the API
  // directly. The actual enforcement is authenticateJWT on the server, which
  // is why both halves exist.
  public isLoggedIn(): boolean {
    return this.authenticationService.isLoggedIn();
  }

  // Stash the trip code in browser local storage so the edit-trip
  // component can pick it up after the route change.
  public editTrip(trip: Trip) {
    localStorage.removeItem('tripCode');
    localStorage.setItem('tripCode', trip.code);
    this.router.navigate(['edit-trip']);
  }

  // No guide equivalent. Deletion is the only irreversible action in
  // the admin site, so it is confirmed before the request is sent.
  public deleteTrip(trip: Trip) {
    if (!confirm('Delete trip ' + trip.code + ' (' + trip.name + ')? This cannot be undone.')) {
      return;
    }

    this.tripDataService.deleteTrip(trip.code)
      .subscribe({
        next: (value: any) => {
          console.log('Deleted trip: ' + trip.code);
          this.tripDeleted.emit(trip.code);
        },
        error: (error: any) => {
          console.log('Error: ' + error);
        }
      });
  }
}