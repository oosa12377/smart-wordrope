import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { AddClothesComponent } from './pages/add-clothes/add-clothes.component';
import { OutfitSuggesterComponent } from './pages/outfit-suggester/outfit-suggester.component';
import { AiStylistComponent } from './pages/ai-stylist/ai-stylist.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot', component: ForgotPasswordComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'add-clothes',
    component: AddClothesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'suggest-random',
    component: OutfitSuggesterComponent,
    canActivate: [authGuard],
  },
  {
    path: 'ai-stylist',
    component: AiStylistComponent,
    canActivate: [authGuard],
  },
];
