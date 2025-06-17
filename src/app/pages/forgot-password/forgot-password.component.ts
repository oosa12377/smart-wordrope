import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../auth.css'],
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm!: FormGroup;
  isLoading: boolean = false;
  message: string = '';
  isError: boolean = false;

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.message = '';
    this.isError = false;
    const email = this.forgotForm.value.email;
    this.authService
      .sendPasswordResetEmail(email)
      .then(() => {
        this.isLoading = false;
        this.message =
          'A password reset link has been sent to your email address.';
        this.forgotForm.reset();
      })
      .catch((error) => {
        this.isLoading = false;
        this.isError = true;
        if (error.message === 'auth/user-not-found') {
          this.message = 'This email address is not registered.';
        } else {
          this.message = 'An error occurred. Please try again later.';
        }
      });
  }
}
