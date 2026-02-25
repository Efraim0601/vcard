import { Injectable } from '@angular/core';
import type { BusinessCard, SavedContact } from '../models/business-card';

const MY_CARD_KEY = 'my-business-card';
const SAVED_CONTACTS_KEY = 'saved-contacts';
const SHARED_CARDS_KEY = 'shared-cards';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getMyCard(): BusinessCard | null {
    const data = localStorage.getItem(MY_CARD_KEY);
    return data ? JSON.parse(data) : null;
  }

  saveMyCard(card: BusinessCard): void {
    localStorage.setItem(MY_CARD_KEY, JSON.stringify(card));
    const sharedCards = this.getSharedCards();
    sharedCards[card.id] = card;
    localStorage.setItem(SHARED_CARDS_KEY, JSON.stringify(sharedCards));
  }

  deleteMyCard(): void {
    localStorage.removeItem(MY_CARD_KEY);
  }

  getSavedContacts(): SavedContact[] {
    const data = localStorage.getItem(SAVED_CONTACTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveContact(card: BusinessCard): void {
    const contacts = this.getSavedContacts();
    const existing = contacts.find((c) => c.cardId === card.id);
    if (!existing) {
      const newContact: SavedContact = {
        id: crypto.randomUUID(),
        cardId: card.id,
        card,
        savedAt: new Date().toISOString(),
      };
      contacts.push(newContact);
      localStorage.setItem(SAVED_CONTACTS_KEY, JSON.stringify(contacts));
    }
  }

  removeContact(contactId: string): void {
    const contacts = this.getSavedContacts().filter((c) => c.id !== contactId);
    localStorage.setItem(SAVED_CONTACTS_KEY, JSON.stringify(contacts));
  }

  isContactSaved(cardId: string): boolean {
    return this.getSavedContacts().some((c) => c.cardId === cardId);
  }

  getSharedCards(): Record<string, BusinessCard> {
    const data = localStorage.getItem(SHARED_CARDS_KEY);
    return data ? JSON.parse(data) : {};
  }

  getCardById(id: string): BusinessCard | null {
    const cards = this.getSharedCards();
    return cards[id] ?? null;
  }
}
