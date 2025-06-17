import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['../auth.css'],
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      displayName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    const { displayName, email, password } = this.registerForm.value;
    this.authService
      .register(email, password, displayName)
      .then(() => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      })
      .catch((error) => {
        this.isLoading = false;
        if (error.code === 'auth/email-already-in-use') {
          this.errorMessage =
            'This email is already registered. Please try to login.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      });
  }
}
