import { Routes } from '@angular/router';
import { Home } from './layouts/home/home';
import { ResScanner } from './layouts/res-scanner/res-scanner';
import { Viewer3D } from './layouts/viewer-3d/viewer-3d';

export const routes: Routes = [
    {path: '', component: Viewer3D},
    {path: 'res-scanner', component: ResScanner},
    {path: 'viewer-3d', component: Viewer3D}
];
