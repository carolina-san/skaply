import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const expectedRoles = route.data['roles'] as Array<string>;

    return authService.isAuthReady$.pipe(
        filter(isReady => isReady),
        take(1),
        map(() => {
            const user = authService.getCurrentUser();

            if (!user) {
                return router.createUrlTree(['/login']);
            }

            if (expectedRoles && expectedRoles.includes(user.role)) {
                return true;
            }

            return router.createUrlTree(['/catalogo']);
        })
    );
};
