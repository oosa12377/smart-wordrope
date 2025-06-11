import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Please enter a valid email and password.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password)
      .then((userCredential) => {
        this.isLoading = false;
        console.log('User logged in successfully:', userCredential.user);
        this.router.navigate(['/add-clothes'] );   
      })
      .catch((error) => {
        this.isLoading = false;
        this.handleLoginError(error);
      });
  }

  private handleLoginError(error: any): void {
    console.error('Login Error:', error.code);
    switch (error.code) {
      case 'auth/invalid-credential':
        this.errorMessage = 'Invalid email or password.';
        break;
      case 'auth/too-many-requests':
        this.errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts.';
        break;
      default:
        this.errorMessage = 'An unexpected error occurred. Please try again.';
        break;
    }
  }
}