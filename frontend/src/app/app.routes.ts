import { Routes } from '@angular/router';
import { Home } from './layouts/home/home';
import { ResScanner } from './layouts/res-scanner/res-scanner';
import { Viewer3D } from './layouts/viewer-3d/viewer-3d';
import { Landing } from './layouts/landing/landing';
import { Motor } from './layouts/motor/motor';
import { Registro } from './layouts/registro/registro';
import { Login } from './layouts/login/login';
import { Profile } from './layouts/profile/profile';
import { Cookies } from './layouts/cookies/cookies';
import { MarcoLegal } from './layouts/marco-legal/marco-legal';

export const routes: Routes = [
    {path: '', component: Landing},
    {path: 'catalogo', component: Home},
    {path: 'res-scanner', component: ResScanner},
    {path: 'viewer-3d/:ref', component: Viewer3D},
    {path: 'motor', component: Motor},
    {path: 'registro', component: Registro},
    {path: 'login', component: Login},
    {path: 'profile', component: Profile},
    {path: 'cookies', component: Cookies},
    {path: 'marco-legal', component: MarcoLegal}
];
