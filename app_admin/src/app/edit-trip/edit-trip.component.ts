import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { TripDataService } from '../services/trip-data.service';
import { Trip } from '../models/trip';

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-trip.component.html',
  styleUrl: './edit-trip.component.css'
})

export class EditTripComponent implements OnInit {

  public editForm!: FormGroup;
  trip!: Trip;
  submitted = false;
  message : string = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private tripDataService: TripDataService
  ) {}

  ngOnInit() : void {

    // Retrieve stashed trip code
    let tripCode = localStorage.getItem("tripCode");
    if (!tripCode) {
      alert("Something wrong, couldn't find where I stashed tripCode!");
      this.router.navigate(['']);
      return;
    }

    console.log('EditTripComponent::ngOnInit');
    console.log('tripcode:' + tripCode);

    this.editForm = this.formBuilder.group({
      _id: [],
      code: [tripCode, Validators.required],
      name: ['', Validators.required],
      length: ['', Validators.required],
      start: ['', Validators.required],
      resort: ['', Validators.required],
      perPerson: ['', Validators.required],
      image: ['', Validators.required],
      description: ['', Validators.required]
    })

    this.tripDataService.getTrip(tripCode)
      .subscribe({
        next: (value: any) => {
          this.trip = value;

          // DEVIATION from the guide: the empty case is tested BEFORE
          // touching value[0]. The guide calls patchValue(value[0])
          // first, which throws on an empty result before its own
          // if(!value) check can ever run.
          if (!value || value.length === 0) {
            this.message = 'No Trip Retrieved!';
            console.log(this.message);
            return;
          }

          // DEVIATION from the guide: this is the guide's step 12
          // "challenge activity". Mongo returns start as a full ISO
          // timestamp (2026-12-01T08:00:00.000Z) but <input type="date">
          // accepts only yyyy-MM-dd. Patching the raw value leaves the
          // field empty, which then fails Validators.required and makes
          // the Save button appear dead. Slicing to the first ten
          // characters gives the input the format it expects. On submit
          // the browser sends yyyy-MM-dd back and Mongoose casts it to
          // a Date, so no conversion is needed in the other direction.
          const record = { ...value[0] };
          if (record.start) {
            record.start = String(record.start).substring(0, 10);
          }

          // Populate our record into the form
          this.editForm.patchValue(record);

          this.message = 'Trip: ' + tripCode + ' retrieved';
          console.log(this.message);
        },
        error: (error: any) => {
          console.log('Error: ' + error);
        }
      })
  }

  public onSubmit() {
    this.submitted = true;

    if (this.editForm.valid) {
      this.tripDataService.updateTrip(this.editForm.value)
        .subscribe({
          next: (value: any) => {
            console.log(value);
            this.router.navigate(['']);
          },
          error: (error: any) => {
            console.log('Error: ' + error);
          }
        })
    }
  }

  // get the form short name to access the form fields
  get f() { return this.editForm.controls; }
}