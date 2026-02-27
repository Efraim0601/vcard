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

  private autoMode = false;
  private autoDone = false;

  constructor(
    private router: Router,
    private cardApi: CardApiService,
    private toast: ToastService,
    private vcard: VcardService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const autoParam = this.route.snapshot.queryParamMap.get('auto');
    this.autoMode = autoParam === '1' || autoParam === 'true';
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
          if (this.autoMode && !this.isPreview() && !this.autoDone) {
            this.autoDone = true;
            this.runAutoFlow();
          }
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  /**
   * Flux auto (QR lien avec ?auto=1) : enregistre le contact puis télécharge
   * l'image de la carte une fois la vue rendue.
   */
  private runAutoFlow(): void {
    const c = this.card();
    if (!c) return;
    this.cardApi.saveContact(c.id).subscribe({
      next: () => this.isSaved.set(true),
      error: () => {},
    });
    this.toast.info('Téléchargement de la carte...');
    // Attendre que le DOM (cardPreviewBox) soit rendu avant d'exporter l'image
    setTimeout(() => this.downloadCardImage(), 1200);
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
