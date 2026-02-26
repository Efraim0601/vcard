import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CardApiService } from '../../services/card-api.service';
import { ToastService } from '../../services/toast.service';
import { CardPreviewComponent } from '../../components/card-preview/card-preview.component';
import type { BusinessCard } from '../../models/business-card';

const FORM_INIT = {
  fullName: '',
  title: '',
  company: '',
  mobile: '',
  office: '',
  email: '',
  website: '',
};

@Component({
  selector: 'app-create-card',
  standalone: true,
  imports: [RouterLink, FormsModule, CardPreviewComponent],
  templateUrl: './create-card.component.html',
  styleUrl: './create-card.component.css',
})
export class CreateCardComponent implements OnInit {
  showPreview = signal(false);
  formData = signal({ ...FORM_INIT });

  isEditing = computed(() => {
    return this.route.snapshot.queryParamMap.get('edit') === 'true';
  });

  canPreview = computed(() => {
    const d = this.formData();
    return !!(d.fullName?.trim() && d.title?.trim() && d.company?.trim());
  });

  previewCard = computed((): BusinessCard => {
    const d = this.formData();
    return {
      id: 'preview',
      fullName: d.fullName,
      title: d.title,
      company: d.company,
      mobile: d.mobile || undefined,
      office: d.office || undefined,
      email: d.email || undefined,
      website: d.website || undefined,
      createdAt: new Date().toISOString(),
    };
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cardApi: CardApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    if (this.isEditing()) {
      this.cardApi.getMyCard().subscribe({
        next: (myCard) => {
          if (myCard) {
            this.formData.set({
              fullName: myCard.fullName,
              title: myCard.title,
              company: myCard.company,
              mobile: myCard.mobile ?? '',
              office: myCard.office ?? '',
              email: myCard.email ?? '',
              website: myCard.website ?? '',
            });
          }
        },
      });
    }
  }

  update(field: keyof typeof FORM_INIT, value: string): void {
    this.formData.update((prev) => ({ ...prev, [field]: value }));
  }

  save(): void {
    if (!this.canPreview()) {
      this.toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    const d = this.formData();
    const payload = {
      fullName: d.fullName,
      title: d.title,
      company: d.company,
      mobile: d.mobile || undefined,
      office: d.office || undefined,
      email: d.email || undefined,
      website: d.website || undefined,
    };
    const isEditing = this.isEditing();
    const req = isEditing
      ? this.cardApi.updateMyCard({ id: '', createdAt: '', ...payload })
      : this.cardApi.createCard(payload);
    req.subscribe({
      next: () => {
        this.toast.success(isEditing ? 'Carte mise à jour avec succès' : 'Carte créée avec succès');
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.toast.error('Impossible de joindre le serveur. Vérifiez que le backend est démarré et que l\'URL est correcte.');
        } else if (err.status === 502 || err.status === 503) {
          this.toast.error('Service temporairement indisponible. Réessayez dans quelques secondes.');
        } else {
          this.toast.error(err.error?.message || 'Erreur lors de l\'enregistrement.');
        }
      },
    });
  }

  openPreview(): void {
    if (this.canPreview()) this.showPreview.set(true);
  }

  closePreview(): void {
    this.showPreview.set(false);
  }
}
