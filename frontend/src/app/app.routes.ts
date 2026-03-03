import { Routes } from '@angular/router';
import { Home } from './layouts/home/home';
import { Viewer3D } from './layouts/viewer-3d/viewer-3d';
import { Landing } from './layouts/landing/landing';
import { Register } from './layouts/register/register';
import { Login } from './layouts/login/login';
import { AdminProfile } from './layouts/admin-profile/admin-profile';
import { Cookies } from './layouts/legal/cookies';
import { LegalNotice } from './layouts/legal/legal-notice';
import { Privacy } from './layouts/legal/privacy';
import { ProviderProfile } from './layouts/provider-profile/provider-profile';
import { WebglSceneComponent } from './layouts/webgl-demo-1/webgl-demo-1'; //new
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
    { path: '', component: Landing },
    { path: 'catalogo', component: Home },
    { path: 'viewer-3d/:ref', component: Viewer3D },
    { path: 'register', component: Register },
    { path: 'login', component: Login },
    { path: 'login/success', component: Login }, // Maneja el callback de Google OAuth
    { path: 'admin', component: AdminProfile, canActivate: [roleGuard], data: { roles: ['admin'] } },
    { path: 'provider', component: ProviderProfile, canActivate: [roleGuard], data: { roles: ['provider'] } },
    { path: 'cookies', component: Cookies },
    { path: 'legal-notice', component: LegalNotice },
    { path: 'privacy', component: Privacy },
    { path: 'webgl1', component: WebglSceneComponent }, //new
    { path: '**', redirectTo: 'catalogo' } // Redirige cualquier ruta no encontrada al catálogo
];
