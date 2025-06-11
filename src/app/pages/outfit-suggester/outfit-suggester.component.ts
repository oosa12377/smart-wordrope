import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsService, Item } from '../../services/items.service';
import { GeminiService } from '../../services/gemini.service'; // تأكد من استيراد الخدمة

@Component({
  selector: 'app-outfit-suggester',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outfit-suggester.component.html',
  styleUrls: ['./outfit-suggester.component.css']
})
export class OutfitSuggesterComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private geminiService = inject(GeminiService); 

  allItems: Item[] = [];
  suggestedOutfit: Item[] = [];
  isLoading = true;
  isAiLoading = false;

  ngOnInit(): void {
    this.itemsService.getItems().subscribe(items => {
      this.allItems = items;
      this.isLoading = false;
    });
  }

  suggestOutfit(): void {
    if (this.allItems.length < 3) {
      alert('You need at least one Top, one Bottom, and one pair of Shoes to get a suggestion.');
      return;
    }
    const tops = this.allItems.filter(item => item.type === 'Top');
    const bottoms = this.allItems.filter(item => item.type === 'Bottom');
    const shoes = this.allItems.filter(item => item.type === 'Shoes');

    if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
      alert("Outfit suggestion requires at least one 'Top', one 'Bottom', and one 'Shoes'. Please categorize your items correctly.");
      return;
    }

    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const randomShoes = shoes[Math.floor(Math.random() * shoes.length)];

    this.suggestedOutfit = [randomTop, randomBottom, randomShoes];
  }

  suggestOutfitWithAi(): void {
    if (this.allItems.length < 3) {
      alert('AI suggestion requires a good selection of items.');
      return;
    }
    this.isAiLoading = true;
    this.suggestedOutfit = [];

    this.geminiService.generateOutfitSuggestion(this.allItems).subscribe({
      next: (response: any) => {
        try {
          const responseText = response.candidates[0].content.parts[0].text;
          const suggestedItemNames: string[] = JSON.parse(responseText);
          this.suggestedOutfit = this.allItems.filter(item => 
            suggestedItemNames.includes(item.name)
          );
        } catch (error) {
          console.error('Error parsing AI response:', error);
          alert('The AI returned an unexpected response. Please try again.');
        } finally {
          this.isAiLoading = false;
        }
      },
      error: (err: any) => {
        console.error('Error from AI service:', err);
        alert('An error occurred while contacting the AI service.');
        this.isAiLoading = false;
      }
    });
  }
}