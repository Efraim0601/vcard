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
   * Retourne une data URL du vCard (comme qr-business-card).
   * Sur mobile, ouvrir cette URL ouvre directement l'écran « Ajouter aux contacts » sans fichier.
   */
  getVCardDataUrl(card: BusinessCard): string {
    const vcard = '\ufeff' + this.generateVCard(card);
    const base64 = btoa(unescape(encodeURIComponent(vcard)));
    return `data:text/vcard;charset=utf-8;base64,${base64}`;
  }

  /**
   * Retourne le vCard en texte brut (pour l’encoder dans un QR comme qr-business-card).
   * Au scan, le téléphone ouvre directement l’écran d’enregistrement du contact.
   */
  getVCardRaw(card: BusinessCard): string {
    return this.generateVCard(card);
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
   * Comportement natif sur mobile : partage vers l’app Contacts (pas de téléchargement de fichier).
   * Sinon ouvre l’invite « Ajouter aux contacts » ou télécharge le .vcf (desktop).
   */
  /**
   * Même scénario que qr-business-card : ouvre le vCard pour que le téléphone
   * affiche directement l'écran « Ajouter aux contacts » (import direct, pas de fichier).
   */
  addToPhoneContact(card: BusinessCard): void {
    const dataUrl = this.getVCardDataUrl(card);
    if (dataUrl.length <= 65536) {
      window.location.href = dataUrl;
      return;
    }
    const blob = new Blob(['\ufeff' + this.generateVCard(card)], { type: 'text/vcard;charset=utf-8' });
    window.location.href = URL.createObjectURL(blob);
  }

  /**
   * Génère et télécharge une image PNG du template de la carte (visuel avec les données).
   */
  async exportCardAsImage(cardElement: HTMLElement, cardName: string): Promise<void> {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardElement, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const fileName = `${(cardName || 'carte').replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '')}_carte.png`;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png', 1);
  }
}
