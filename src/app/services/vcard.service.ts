import { Injectable } from '@angular/core';
import type { BusinessCard } from '../models/business-card';

@Injectable({ providedIn: 'root' })
export class VcardService {
  generateVCard(card: BusinessCard): string {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.fullName}`,
      `N:${card.fullName.split(' ').reverse().join(';')};;;`,
      `TITLE:${card.title}`,
      `ORG:${card.company}`,
    ];
    if (card.mobile) lines.push(`TEL;TYPE=CELL:${card.mobile}`);
    if (card.office) lines.push(`TEL;TYPE=WORK:${card.office}`);
    if (card.email) lines.push(`EMAIL:${card.email}`);
    if (card.website) lines.push(`URL:${card.website}`);
    lines.push('END:VCARD');
    return lines.join('\r\n');
  }

  downloadVCard(card: BusinessCard): void {
    const vcard = this.generateVCard(card);
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.fullName.replace(/\s+/g, '_')}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
