import { Routes } from '@angular/router';
import { Home } from './layouts/home/home';
import { ResScanner } from './layouts/res-scanner/res-scanner';

export const routes: Routes = [
    {path: '', component: Home},
    {path: 'res-scanner', component: ResScanner}
];
