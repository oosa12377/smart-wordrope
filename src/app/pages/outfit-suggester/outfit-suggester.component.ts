import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Required for ngModel
import { ItemsService, Item } from '../../services/items.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-outfit-suggester',
  standalone: true,
  imports: [CommonModule, FormsModule], // Ensure FormsModule is imported
  templateUrl: './outfit-suggester.component.html',
  styleUrls: ['./outfit-suggester.component.css'],
})
export class OutfitSuggesterComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private geminiService = inject(GeminiService);

  // --- State Properties ---
  allItems: Item[] = [];
  suggestedOutfit: Item[] = [];
  isLoading = true; // For initial data loading
  isAiLoading = false; // For the AI suggestion process

  // --- Filter Properties ---
  styles: string[] = ['Casual', 'Formal', 'Sport', 'Smart Casual', 'Vintage'];
  selectedStyle: string = ''; // Bound to the dropdown in the HTML

  ngOnInit(): void {
    // Fetch all of the user's items when the component loads
    this.itemsService.getItems().subscribe((items) => {
      this.allItems = items;
      this.isLoading = false;
    });
  }

  /**
   * Generates a style-matched "random" outfit.
   * If a style is selected, it uses that style.
   * If not, it picks a random style from the user's wardrobe.
   */
  suggestOutfit(): void {
    if (this.allItems.length < 2) {
      alert('You need more items to get a good suggestion.');
      return;
    }

    // Determine which styles to consider based on the user's selection
    const stylesToConsider = this.selectedStyle
      ? [this.selectedStyle]
      : [...new Set(this.allItems.map((item) => item.style).filter(Boolean))];

    if (stylesToConsider.length === 0) {
      alert('Please add styles to your items for better suggestions.');
      return;
    }

    // Pick a style from the pool of styles to consider
    const randomStyle =
      stylesToConsider[Math.floor(Math.random() * stylesToConsider.length)];

    console.log(`Suggesting a "${randomStyle}" outfit...`);

    // Filter items based on the chosen style
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
        `Could not find a complete outfit for the style "${randomStyle}". Please add more items with this style or try again.`
      );
      return;
    }

    // Select a random item from each filtered category
    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];

    const suggested = [randomTop, randomBottom];

    // Add shoes if available in the same style
    if (shoes.length > 0) {
      const randomShoes = shoes[Math.floor(Math.random() * shoes.length)];
      suggested.push(randomShoes);
    }

    this.suggestedOutfit = suggested;
  }

  /**
   * Generates an outfit using the Gemini AI, respecting the selected style.
   */
  suggestOutfitWithAi(): void {
    if (this.allItems.length < 3) {
      alert('AI suggestion requires a good selection of items.');
      return;
    }
    this.isAiLoading = true;
    this.suggestedOutfit = []; // Clear previous suggestion

    // Call the service, passing the selected style
    this.geminiService
      .generateOutfitSuggestion(this.allItems, this.selectedStyle)
      .subscribe({
        next: (response: any) => {
          try {
            // 1. Get the raw text response from the AI
            let responseText = response.candidates[0].content.parts[0].text;

            // 2. Clean the text from markdown formatting
            responseText = responseText
              .replace(/```json/g, '')
              .replace(/```/g, '')
              .trim();

            // 3. Parse the clean text into an array of names
            const suggestedItemNames: string[] = JSON.parse(responseText);

            // 4. Find the full item objects that match the names suggested by the AI
            const rawAiItems = this.allItems.filter((item) =>
              suggestedItemNames.includes(item.name)
            );

            // 5. Apply a "Safety Filter" to ensure one of each type
            const finalTop = rawAiItems.find((item) => item.type === 'Top');
            const finalBottom = rawAiItems.find(
              (item) => item.type === 'Bottom'
            );
            const finalShoes = rawAiItems.find((item) => item.type === 'Shoes');

            // Assemble the final outfit, filtering out any undefined values
            this.suggestedOutfit = [finalTop, finalBottom, finalShoes].filter(
              Boolean
            ) as Item[];

            if (this.suggestedOutfit.length < 2) {
              // Check for at least a top and bottom
              console.warn('AI suggestion was incomplete after filtering.');
              alert('The AI gave a partial suggestion. Please try again!');
            }
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
        },
      });
  }
}
