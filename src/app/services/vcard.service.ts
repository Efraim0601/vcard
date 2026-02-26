import { Injectable } from '@angular/core';
import type { BusinessCard } from '../models/business-card';

@Injectable({ providedIn: 'root' })
export class VcardService {
  /** Échappe les caractères spéciaux pour vCard (RFC 3.0) */
  private escape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  generateVCard(card: BusinessCard): string {
    const fn = String(card?.fullName ?? '').trim() || 'Contact';
    const namePart = fn.split(/\s+/).filter(Boolean).reverse().map((s) => this.escape(s)).join(';');
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${this.escape(fn)}`,
      `N:${namePart};;;`,
      `TITLE:${this.escape(String(card?.title ?? ''))}`,
      `ORG:${this.escape(String(card?.company ?? ''))}`,
    ];
    if (card.mobile) lines.push(`TEL;TYPE=CELL:${card.mobile.replace(/\s/g, '')}`);
    if (card.office) lines.push(`TEL;TYPE=WORK:${card.office.replace(/\s/g, '')}`);
    if (card.email) lines.push(`EMAIL:${this.escape(card.email)}`);
    if (card.website) lines.push(`URL:${card.website?.replace(/^\s+|\s+$/g, '') || ''}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  getVCardFileName(card: BusinessCard): string {
    const name = String(card?.fullName ?? 'contact').replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '');
    return `${name || 'contact'}.vcf`;
  }

  /**
   * Télécharge le vCard (desktop). Sur mobile, préférer addToPhoneContact().
   */
  downloadVCard(card: BusinessCard): void {
    const vcard = this.generateVCard(card);
    const blob = new Blob(['\ufeff' + vcard], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.getVCardFileName(card);
    a.setAttribute('rel', 'noopener');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  /**
   * Ouvre directement l’invite « Ajouter aux contacts » du téléphone (mobile)
   * ou télécharge le .vcf (desktop).
   * Sur mobile : navigation vers le .vcf pour que l’OS affiche tout de suite la boîte
   * « Ajouter aux contacts » sans passer par le dossier Téléchargements.
   */
  addToPhoneContact(card: BusinessCard): void {
    const vcard = this.generateVCard(card);

    if (this.isMobile()) {
      const blob = new Blob(['\ufeff' + vcard], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      // Navigation vers le .vcf : l’OS ouvre directement « Ajouter aux contacts »
      // (pas de téléchargement puis ouverture manuelle du fichier).
      window.location.href = url;
      // Ne pas révoquer l’URL : la page charge le vcf, le navigateur la garde en mémoire.
    } else {
      this.downloadVCard(card);
    }
  }

  private isMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1;
  }
}
