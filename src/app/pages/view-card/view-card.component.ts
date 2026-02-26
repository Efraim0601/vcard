import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CardApiService } from '../../services/card-api.service';
import { ToastService } from '../../services/toast.service';
import { VcardService } from '../../services/vcard.service';
import { CardPreviewComponent } from '../../components/card-preview/card-preview.component';
import type { BusinessCard } from '../../models/business-card';

@Component({
  selector: 'app-view-card',
  standalone: true,
  imports: [RouterLink, CardPreviewComponent],
  templateUrl: './view-card.component.html',
  styleUrl: './view-card.component.css',
})
export class ViewCardComponent implements OnInit {
  @ViewChild('cardPreviewBox') cardPreviewBox!: ElementRef<HTMLElement>;

  card = signal<BusinessCard | null>(null);
  loading = signal(true);
  error = signal(false);
  isSaved = signal(false);

  route = inject(ActivatedRoute);
  isPreview = computed(() => this.route.snapshot.queryParamMap.get('preview') === 'true');

  /** Lien direct vers le vCard (data URL) : au clic, l'OS ouvre « Ajouter aux contacts » sans télécharger de fichier. */
  addToContactsUrl = computed(() => {
    const c = this.card();
    if (!c || this.isSaved()) return '';
    return this.vcard.isDataUrlSafeForLink(c) ? this.vcard.getVCardDataUrl(c) : '';
  });

  constructor(
    private router: Router,
    private cardApi: CardApiService,
    private toast: ToastService,
    private vcard: VcardService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }
    this.cardApi.getCardById(id).subscribe({
      next: (found) => {
        if (!found) {
          this.error.set(true);
        } else {
          this.card.set(found);
          this.cardApi.isContactSaved(id).subscribe((saved) => this.isSaved.set(saved));
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Fallback quand la data URL est trop longue : ouvre le vCard (sans blob). */
  addToPhoneContact(): void {
    const c = this.card();
    if (c) this.vcard.addToPhoneContact(c);
  }

  /** Enregistre le contact dans l'app (backend) ; appelé au clic sur le lien « Ajouter aux contacts » avant navigation. */
  onAddToContactsClick(): void {
    const c = this.card();
    if (!c || this.isSaved()) return;
    this.cardApi.saveContact(c.id).subscribe({
      next: () => this.isSaved.set(true),
      error: () => {},
    });
  }

  download(): void {
    const c = this.card();
    if (!c) return;
    this.vcard.downloadVCard(c);
    this.toast.success('Fichier contact téléchargé');
  }

  async downloadCardImage(): Promise<void> {
    const c = this.card();
    const el = this.cardPreviewBox?.nativeElement;
    if (!c || !el) {
      this.toast.error('Carte non disponible.');
      return;
    }
    try {
      this.toast.info('Génération de l\'image...');
      el.classList.add('exporting');
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      await this.vcard.exportCardAsImage(el, c.fullName);
      this.toast.success('Image de la carte téléchargée');
    } catch (e) {
      this.toast.error('Impossible de générer l\'image.');
    } finally {
      el.classList.remove('exporting');
    }
  }
}
