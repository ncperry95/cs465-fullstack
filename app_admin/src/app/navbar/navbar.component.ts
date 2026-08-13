import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {

  constructor(
    private authenticationService: AuthenticationService,
    private router: Router
  ) { }

  ngOnInit(): void { }

  // Delegates to the AuthenticationService so the template has a single
  // question to ask. Drives which of the two links is rendered.
  public isLoggedIn(): boolean {
    return this.authenticationService.isLoggedIn();
  }

  // Shown next to the Log Out link so it is obvious who is signed in.
  public getUserName(): string {
    return this.authenticationService.getCurrentUser().name;
  }

  // DEVIATION FROM GUIDE (page 210): the guide's onLogout only clears the
  // token. If the user logs out from a protected page they stay on it with
  // the buttons gone and no explanation. Sending them back to the trip list
  // makes the state change visible.
  public onLogout(): void {
    this.authenticationService.logout();
    this.router.navigate(['']);
  }
}