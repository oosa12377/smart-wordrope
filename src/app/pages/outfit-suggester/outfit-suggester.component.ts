import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemsService, Item } from '../../services/items.service';

@Component({
  selector: 'app-outfit-suggester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './outfit-suggester.component.html',
  styleUrls: ['./outfit-suggester.component.css'],
})
export class OutfitSuggesterComponent implements OnInit {
  private itemsService = inject(ItemsService);

  allItems: Item[] = [];
  suggestedOutfit: Item[] = [];
  isLoading = true;

  styles: string[] = ['Casual', 'Formal', 'Sport', 'Smart Casual', 'Vintage'];
  selectedStyle: string = '';

  ngOnInit(): void {
    this.itemsService.getItems().subscribe((items) => {
      this.allItems = items;
      this.isLoading = false;
    });
  }

  suggestOutfit(): void {
    if (this.allItems.length < 2) {
      alert('You need more items to get a good suggestion.');
      return;
    }
    const stylesToConsider = this.selectedStyle
      ? [this.selectedStyle]
      : this.styles;
    const randomStyle =
      stylesToConsider[Math.floor(Math.random() * stylesToConsider.length)];

    const tops = this.allItems.filter(
      (item) => item.type === 'Top' && item.style === randomStyle
    );
    const bottoms = this.allItems.filter(
      (item) => item.type === 'Bottom' && item.style === randomStyle
    );
    const shoes = this.allItems.filter(
      (item) => item.type === 'Shoes' && item.style === randomStyle
    );

    if (tops.length === 0 || bottoms.length === 0) {
      alert(
        `Could not find a complete outfit for the style "${randomStyle}". Please add more items.`
      );
      return;
    }

    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const suggested = [randomTop, randomBottom];

    if (shoes.length > 0) {
      const randomShoes = shoes[Math.floor(Math.random() * shoes.length)];
      suggested.push(randomShoes);
    }

    this.suggestedOutfit = suggested;
  }
}
