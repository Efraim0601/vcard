import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

/**
 * Log les requêtes API en erreur (URL + statut) dans la console pour faciliter le débogage
 * lorsque le front n'arrive pas à joindre le backend (ex. "Enregistrer et générer" ne répond pas).
 */
export const apiLogInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const url = req.url;
      const method = req.method;
      const status = err?.status ?? '?';
      console.warn(`[API] ${method} ${url} → erreur ${status}`, err.message || err);
      return throwError(() => err);
    })
  );
};
