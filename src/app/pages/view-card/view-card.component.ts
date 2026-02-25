import { Component, OnInit, signal, computed, inject } from '@angular/core';
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
  card = signal<BusinessCard | null>(null);
  loading = signal(true);
  error = signal(false);
  isSaved = signal(false);

  route = inject(ActivatedRoute);
  isPreview = computed(() => this.route.snapshot.queryParamMap.get('preview') === 'true');

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

  saveContact(): void {
    const c = this.card();
    if (!c) return;
    if (this.isSaved()) {
      this.toast.info('Ce contact est déjà enregistré');
      return;
    }
    this.cardApi.saveContact(c.id).subscribe({
      next: () => {
        this.isSaved.set(true);
        this.toast.success('Contact enregistré avec succès');
      },
      error: () => this.toast.error('Erreur lors de l\'enregistrement'),
    });
  }

  download(): void {
    const c = this.card();
    if (!c) return;
    this.vcard.downloadVCard(c);
    this.toast.success('Contact téléchargé');
  }
}
