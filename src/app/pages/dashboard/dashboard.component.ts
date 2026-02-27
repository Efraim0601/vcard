import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { CardPreviewComponent } from '../../components/card-preview/card-preview.component';
import { CardApiService } from '../../services/card-api.service';
import { ToastService } from '../../services/toast.service';
import { VcardService } from '../../services/vcard.service';
import type { BusinessCard } from '../../models/business-card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, QRCodeComponent, CardPreviewComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  myCard = signal<BusinessCard | null>(null);
  copied = signal(false);
  shareMode = signal(false);
  /** true = QR lien vers la page ; false = QR avec données vCard (enregistrement direct au scan, comme qr-business-card) */
  shareQRType = signal<'link' | 'vcard'>('vcard');

  shareUrl = computed(() => {
    const card = this.myCard();
    if (!card) return '';
    return typeof window !== 'undefined' ? `${window.location.origin}/card/${card.id}` : '';
  });

  /** Données vCard brutes pour le QR : au scan, le téléphone ouvre directement « Ajouter aux contacts » */
  shareVCardData = computed(() => {
    const card = this.myCard();
    if (!card) return '';
    return this.vcard.getVCardRaw(card);
  });

  constructor(
    private router: Router,
    private cardApi: CardApiService,
    private toast: ToastService,
    private vcard: VcardService
  ) {}

  ngOnInit(): void {
    this.cardApi.getMyCard().subscribe({
      next: (card) => {
        if (!card) {
          this.router.navigate(['/create']);
          return;
        }
        this.myCard.set(card);
      },
      error: () => {
        this.toast.error('Impossible de charger la carte');
        this.router.navigate(['/create']);
      },
    });
  }

  copyLink(): void {
    const url = this.shareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      this.toast.success('Lien copié dans le presse-papier');
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  toggleShareMode(): void {
    this.shareMode.update((v) => !v);
  }

  setShareQRType(type: 'link' | 'vcard'): void {
    this.shareQRType.set(type);
  }
}
