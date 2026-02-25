import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardApiService } from '../../services/card-api.service';
import { ToastService } from '../../services/toast.service';
import type { SavedContact } from '../../models/business-card';

@Component({
  selector: 'app-saved-contacts',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './saved-contacts.component.html',
  styleUrl: './saved-contacts.component.css',
})
export class SavedContactsComponent implements OnInit {
  contacts = signal<SavedContact[]>([]);
  searchQuery = signal('');

  filteredContacts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const list = this.contacts();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.card.fullName.toLowerCase().includes(q) ||
        c.card.company.toLowerCase().includes(q) ||
        c.card.title.toLowerCase().includes(q)
    );
  });

  constructor(
    private router: Router,
    private cardApi: CardApiService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.cardApi.getSavedContacts().subscribe({
      next: (list) => this.contacts.set(list),
      error: () => this.toast.error('Impossible de charger les contacts'),
    });
  }

  removeContact(e: Event, contactId: string): void {
    e.stopPropagation();
    this.cardApi.removeContact(contactId).subscribe({
      next: () => {
        this.loadContacts();
        this.toast.success('Contact supprimé');
      },
      error: () => this.toast.error('Erreur lors de la suppression'),
    });
  }

  navigateToCard(cardId: string): void {
    this.router.navigate(['/card', cardId]);
  }
}
