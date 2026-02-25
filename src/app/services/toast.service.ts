import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private container: HTMLElement | null = null;

  private ensureContainer(): HTMLElement {
    if (this.container) return this.container;
    this.container = document.createElement('div');
    this.container.className = 'vcard-toast-container';
    document.body.appendChild(this.container);
    return this.container;
  }

  show(message: string, type: ToastType = 'success'): void {
    const el = this.ensureContainer();
    const toast = document.createElement('div');
    toast.className = `vcard-toast vcard-toast-${type}`;
    toast.textContent = message;
    el.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('vcard-toast-visible'));
    setTimeout(() => {
      toast.classList.remove('vcard-toast-visible');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }
}
