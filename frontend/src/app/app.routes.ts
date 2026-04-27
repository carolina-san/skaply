import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./layouts/landing/landing').then(m => m.Landing) },
    { path: 'home', loadComponent: () => import('./layouts/home/home').then(m => m.Home) },
    { path: 'viewer-3d/:ref', loadComponent: () => import('./layouts/viewer-3d/viewer-3d').then(m => m.Viewer3D) },
    { path: 'register', loadComponent: () => import('./layouts/register/register').then(m => m.Register) },
    { path: 'login', loadComponent: () => import('./layouts/login/login').then(m => m.Login) },
    { path: 'login/success', loadComponent: () => import('./layouts/login/login').then(m => m.Login) }, 
    { path: 'admin', loadComponent: () => import('./layouts/admin-profile/admin-profile').then(m => m.AdminProfile), canActivate: [roleGuard], data: { roles: ['admin'] } },
    { path: 'provider', loadComponent: () => import('./layouts/provider-profile/provider-profile').then(m => m.ProviderProfile), canActivate: [roleGuard], data: { roles: ['provider'] } },
    { path: 'cookies', loadComponent: () => import('./layouts/legal/cookies').then(m => m.Cookies) },
    { path: 'legal-notice', loadComponent: () => import('./layouts/legal/legal-notice').then(m => m.LegalNotice) },
    { path: 'privacy', loadComponent: () => import('./layouts/legal/privacy').then(m => m.Privacy) },
    { path: 'open-data', loadComponent: () => import('./layouts/open-data/open-data').then(m => m.OpenData) },
    { path: 'webgl1', loadComponent: () => import('./layouts/webgl-demo-1/webgl-demo-1').then(m => m.WebglSceneComponent) }, 
    { path: '**', redirectTo: 'home' } 
];
