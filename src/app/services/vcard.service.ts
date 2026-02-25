import { Injectable } from '@angular/core';
import type { BusinessCard } from '../models/business-card';

@Injectable({ providedIn: 'root' })
export class VcardService {
  /** Échappe les caractères spéciaux pour vCard (RFC 3.0) */
  private escape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  }

  generateVCard(card: BusinessCard): string {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${this.escape(card.fullName)}`,
      `N:${card.fullName.split(/\s+/).reverse().map(this.escape).join(';')};;;`,
      `TITLE:${this.escape(card.title)}`,
      `ORG:${this.escape(card.company)}`,
    ];
    if (card.mobile) lines.push(`TEL;TYPE=CELL:${card.mobile.replace(/\s/g, '')}`);
    if (card.office) lines.push(`TEL;TYPE=WORK:${card.office.replace(/\s/g, '')}`);
    if (card.email) lines.push(`EMAIL:${this.escape(card.email)}`);
    if (card.website) lines.push(`URL:${card.website?.replace(/^\s+|\s+$/g, '') || ''}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  getVCardFileName(card: BusinessCard): string {
    return `${card.fullName.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '')}.vcf`;
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
   * Provoque l’ajout du contact dans le téléphone (mobile et desktop).
   * Sur mobile, ouvre le .vcf de façon à ce que l’OS propose « Ajouter aux contacts ».
   */
  addToPhoneContact(card: BusinessCard): void {
    const vcard = this.generateVCard(card);
    const fileName = this.getVCardFileName(card);

    if (this.isMobile()) {
      const blob = new Blob(['\ufeff' + vcard], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } else {
      this.downloadVCard(card);
    }
  }

  private isMobile(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints > 1;
  }
}
