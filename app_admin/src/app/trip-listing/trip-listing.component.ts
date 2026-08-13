import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TripCardComponent } from '../trip-card/trip-card.component';
import { TripDataService } from '../services/trip-data.service';
import { AuthenticationService } from '../services/authentication.service';
import { Trip } from '../models/trip';

// DEVIATION FROM MODULE 6: the component-level "providers: [TripDataService]"
// array has been removed. TripDataService is already declared
// @Injectable({ providedIn: 'root' }), so listing it here as well created a
// second instance scoped to this component's subtree instead of using the
// application-wide singleton. Harmless while the service is stateless, but it
// is a real bug waiting for the first piece of state anyone adds to it. The
// component now uses the root instance, same as everything else.
@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, TripCardComponent],
  templateUrl: './trip-listing.component.html',
  styleUrl: './trip-listing.component.css'
})
export class TripListingComponent implements OnInit {

  trips!: Trip[];
  message: string = '';

  constructor(
    private tripDataService: TripDataService,
    private router: Router,
    private authenticationService: AuthenticationService
  ) {
    console.log('trip-listing constructor');
  }

  // Drives whether the Add Trip button renders. Same delegation the trip-card
  // component uses, and the same caveat applies: this is presentation, and the
  // server-side middleware is what actually enforces anything.
  public isLoggedIn(): boolean {
    return this.authenticationService.isLoggedIn();
  }

  public addTrip(): void {
    this.router.navigate(['add-trip']);
  }

  // Re-fetch after a child card reports a successful delete, so the
  // removed card disappears without a page navigation.
  public onTripDeleted(tripCode: string): void {
    console.log('Listing notified of delete: ' + tripCode);
    this.getStuff();
  }

  private getStuff(): void {
    this.tripDataService.getTrips()
      .subscribe({
        next: (value: any) => {
          this.trips = value;
          if (value.length > 0) {
            this.message = 'There are ' + value.length + ' trips available.';
          }
          else {
            this.message = 'There were no trips retrieved from the database';
          }
          console.log(this.message);
        },
        error: (error: any) => {
          console.log('Error: ' + error);
        }
      })
  }

  ngOnInit(): void {
    console.log('ngOnInit');
    this.getStuff();
  }
}