import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data.service';

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
    private tripDataService: TripDataService
  ) {}

  ngOnInit(): void {

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