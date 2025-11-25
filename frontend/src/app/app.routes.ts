import { Routes } from '@angular/router';
import { Home } from './layouts/home/home';
import { ResScanner } from './layouts/res-scanner/res-scanner';
import { Viewer3D } from './layouts/viewer-3d/viewer-3d';
import { Landing } from './layouts/landing/landing';
import { Motor } from './layouts/motor/motor';
import { Registro } from './layouts/registro/registro';
import { Login } from './layouts/login/login';
import { Profile } from './layouts/profile/profile';

export const routes: Routes = [
    {path: '', component: Landing},
    {path: 'catalogo', component: Home},
    {path: 'res-scanner', component: ResScanner},
    {path: 'viewer-3d/:id', component: Viewer3D},
    {path: 'motor', component: Motor},
    {path: 'registro', component: Registro},
    {path: 'login', component: Login},
    {path: 'profile', component: Profile}
];
