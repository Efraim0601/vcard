import { Component, input } from '@angular/core';
import type { BusinessCard } from '../../models/business-card';

@Component({
  selector: 'app-card-preview',
  standalone: true,
  templateUrl: './card-preview.component.html',
  styleUrl: './card-preview.component.css',
})
export class CardPreviewComponent {
  card = input.required<BusinessCard>();
  className = input<string>('');

  normalizedWebsite(url: string): string {
    return url.startsWith('http') ? url : `https://${url}`;
  }
}
