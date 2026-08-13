import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { User } from '../models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  public formError: string = '';
  public submitted: boolean = false;

  // DEVIATION FROM GUIDE (page 211): the guide's form carries a Name field so
  // the same template could be reused as a registration form, then notes in a
  // footnote that you must type something into Name to log in even though the
  // API ignores it, and calls fixing that "a good exercise to try". Logging in
  // needs an email address and a password. Registration is not part of this
  // module's interface, so the field is gone.
  credentials = {
    email: '',
    password: ''
  };

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) { }

  ngOnInit(): void { }

  public onLoginSubmit(): void {
    this.formError = '';

    if (!this.credentials.email || !this.credentials.password) {
      this.formError = 'All fields are required, please try again.';
      return;
    }

    this.doLogin();
  }

  // DEVIATION FROM GUIDE (pages 213-214): the guide calls login(), immediately
  // asks isLoggedIn(), and if that is false waits three seconds on a
  // setTimeout before asking once more. That is a workaround for a service
  // method that returns void. Since login() now returns an Observable, we
  // subscribe and act when the answer actually arrives: navigate on success,
  // show a real message on failure, and no timer at all.
  private doLogin(): void {
    this.submitted = true;

    const newUser = {
      name: '',
      email: this.credentials.email
    } as User;

    this.authenticationService.login(newUser, this.credentials.password)
      .subscribe({
        next: () => {
          this.submitted = false;
          this.router.navigate(['']);
        },
        error: (err: any) => {
          this.submitted = false;

          if (err.status === 401) {
            this.formError = 'Incorrect email address or password.';
          } else if (err.status === 400) {
            this.formError = 'All fields are required, please try again.';
          } else if (err.status === 0) {
            this.formError = 'Could not reach the server. Is the API running on port 3000?';
          } else {
            this.formError = 'Login failed, please try again.';
          }
        }
      });
  }
}