import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../core/environments/environment';
import type { BusinessCard, SavedContact } from '../models/business-card';

const OWNER_TOKEN_KEY = 'vcard_owner_token';
const DEVICE_ID_KEY = 'vcard_device_id';

/** Génère un UUID v4. Utilise crypto.randomUUID si dispo, sinon getRandomValues ou Math.random (navigateurs anciens / mobiles). */
function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof (crypto as Crypto & { randomUUID?: () => string }).randomUUID === 'function') {
    return (crypto as Crypto & { randomUUID: () => string }).randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Base URL des endpoints API. En prod (Docker) = '' → appels vers /api (même origine, proxy nginx). */
@Injectable({ providedIn: 'root' })
export class CardApiService {
  private readonly baseUrl = environment.apiBaseUrl
    ? `${environment.apiBaseUrl.replace(/\/$/, '')}/api`
    : '/api';

  constructor(private http: HttpClient) {}

  private get deviceId(): string {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = generateDeviceId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  private get ownerToken(): string | null {
    return localStorage.getItem(OWNER_TOKEN_KEY);
  }

  private set ownerToken(value: string | null) {
    if (value) localStorage.setItem(OWNER_TOKEN_KEY, value);
    else localStorage.removeItem(OWNER_TOKEN_KEY);
  }

  private headers(includeOwner = false): HttpHeaders {
    let h = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Device-Id': this.deviceId,
    });
    if (includeOwner && this.ownerToken) {
      h = h.set('X-Owner-Token', this.ownerToken);
    }
    return h;
  }

  createCard(card: Omit<BusinessCard, 'id' | 'createdAt'>): Observable<BusinessCard> {
    const body = {
      fullName: card.fullName,
      title: card.title,
      company: card.company,
      mobile: card.mobile ?? null,
      office: card.office ?? null,
      email: card.email ?? null,
      website: card.website ?? null,
    };
    return this.http
      .post<BusinessCard & { ownerToken?: string }>(`${this.baseUrl}/cards`, body, {
        headers: this.headers(false),
      })
      .pipe(
        map((res) => {
          if (res.ownerToken) this.ownerToken = res.ownerToken;
          return res as BusinessCard;
        }),
        catchError((err) => throwError(() => err))
      );
  }

  getMyCard(): Observable<BusinessCard | null> {
    const token = this.ownerToken;
    if (!token) return of(null);
    return this.http
      .get<BusinessCard>(`${this.baseUrl}/cards/me`, {
        headers: this.headers(true),
      })
      .pipe(
        catchError((err) => {
          if (err?.status === 404) return of(null);
          return throwError(() => err);
        })
      );
  }

  updateMyCard(card: BusinessCard): Observable<BusinessCard> {
    const body = {
      fullName: card.fullName,
      title: card.title,
      company: card.company,
      mobile: card.mobile ?? null,
      office: card.office ?? null,
      email: card.email ?? null,
      website: card.website ?? null,
    };
    return this.http.put<BusinessCard>(`${this.baseUrl}/cards/me`, body, {
      headers: this.headers(true),
    });
  }

  getCardById(id: string): Observable<BusinessCard | null> {
    return this.http.get<BusinessCard>(`${this.baseUrl}/cards/${id}`).pipe(
      catchError((err) => {
        if (err?.status === 404) return of(null);
        return throwError(() => err);
      })
    );
  }

  saveContact(cardId: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/cards/${cardId}/save`, null, {
        headers: this.headers(false),
      })
      .pipe(map(() => undefined));
  }

  isContactSaved(cardId: string): Observable<boolean> {
    return this.http
      .get<boolean>(`${this.baseUrl}/cards/${cardId}/saved`, {
        headers: this.headers(false),
      })
      .pipe(catchError(() => of(false)));
  }

  getSavedContacts(): Observable<SavedContact[]> {
    return this.http
      .get<SavedContact[]>(`${this.baseUrl}/contacts`, {
        headers: this.headers(false),
      })
      .pipe(catchError(() => of([])));
  }

  removeContact(contactId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/contacts/${contactId}`, {
        headers: this.headers(false),
      })
      .pipe(map(() => undefined));
  }

  hasOwnerToken(): boolean {
    return !!this.ownerToken;
  }

  clearOwnerToken(): void {
    this.ownerToken = null;
  }
}
