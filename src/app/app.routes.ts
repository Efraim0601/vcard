import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('./pages/create-card/create-card.component').then((m) => m.CreateCardComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'card/:id',
    loadComponent: () => import('./pages/view-card/view-card.component').then((m) => m.ViewCardComponent),
  },
  {
    path: 'contacts',
    loadComponent: () => import('./pages/saved-contacts/saved-contacts.component').then((m) => m.SavedContactsComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
