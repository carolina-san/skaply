import { Routes } from '@angular/router';
import { Home } from './layouts/home/home';
import { ResScanner } from './layouts/res-scanner/res-scanner';
import { Viewer3D } from './layouts/viewer-3d/viewer-3d';
import { Landing } from './layouts/landing/landing';
import { Motor } from './layouts/motor/motor';
import { Register } from './layouts/register/register';
import { Login } from './layouts/login/login';
import { AdminProfile} from './layouts/adminProfile/adminProfile';
import { Cookies } from './layouts/legal/cookies';
import { LegalNotice } from './layouts/legal/legal-notice';
import { Privacy } from './layouts/legal/privacy';
import { ProviderProfile } from './layouts/provider-profile/provider-profile';

export const routes: Routes = [
    { path: '', component: Landing },
    { path: 'catalogo', component: Home },
    //{path: 'res-scanner', component: ResScanner}, no usado actualmente
    { path: 'viewer-3d/:ref', component: Viewer3D },
    { path: 'register', component: Register },
    { path: 'login', component: Login },
    { path: 'login/success', component: Login }, // Maneja el callback de Google OAuth
    { path: 'admin', component: AdminProfile },
    { path: 'provider', component: ProviderProfile },
    { path: 'cookies', component: Cookies },
    { path: 'legal-notice', component: LegalNotice },
    { path: 'privacy', component: Privacy },
    { path: '**', redirectTo: 'catalogo' } // Redirige cualquier ruta no encontrada al catálogo
];
