import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ItemsService, Item } from '../../services/items.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-ai-stylist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-stylist.component.html',
  styleUrls: ['./ai-stylist.component.css'],
})
export class AiStylistComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private geminiService = inject(GeminiService);

  // --- خصائص الحالة ---
  allItems: Item[] = [];
  suggestedOutfit: Item[] = [];
  isLoading = true;
  isAiLoading = false;

  // --- خصائص الواجهة ---
  userRequest: string = '';
  aiJustification: string = '';
  showNameInput = false; // للتحكم في إظهار حقل الإدخال
  newOutfitName = ''; // ليحتوي على الاسم الذي يكتبه المستخدم

  ngOnInit(): void {
    this.itemsService.getItems().subscribe((items) => {
      this.allItems = items;
      this.isLoading = false;
    });
  }

  // دالة الاقتراح بالذكاء الاصطناعي (تبقى كما هي)
  getAiSuggestion(): void {
    if (this.allItems.length < 3) {
      alert('AI suggestion requires at least 3 items (Top, Bottom, Shoes).');
      return;
    }
    this.isAiLoading = true;
    this.suggestedOutfit = [];
    this.aiJustification = '';

    console.log('--- 1. Starting AI Suggestion ---');
    console.log('User Request:', this.userRequest);

    this.geminiService
      .generateOutfitSuggestion(this.allItems, this.userRequest)
      .subscribe({
        next: (response: any) => {
          console.log('--- 2. Received a response from AI ---', response);
          try {
            let responseText = response.candidates[0].content.parts[0].text;
            console.log('--- 3. Raw response text from AI ---', responseText);

            responseText = responseText
              .replace(/```json/g, '')
              .replace(/```/g, '')
              .trim();

            const parsedResponse = JSON.parse(responseText);
            console.log(
              '--- 4. Parsed response (outfit and justification) ---',
              parsedResponse
            );

            const suggestedItemNames: string[] = parsedResponse.outfit;
            this.aiJustification = parsedResponse.justification;

            const rawAiItems = this.allItems.filter((item) =>
              suggestedItemNames.includes(item.name)
            );
            console.log(
              '--- 5. Found these full items from wardrobe ---',
              rawAiItems
            );

            const finalTop = rawAiItems.find((item) => item.type === 'Top');
            const finalBottom = rawAiItems.find(
              (item) => item.type === 'Bottom'
            );
            const finalShoes = rawAiItems.find((item) => item.type === 'Shoes');

            this.suggestedOutfit = [finalTop, finalBottom, finalShoes].filter(
              Boolean
            ) as Item[];
            console.log(
              '--- 6. Final filtered outfit to be displayed ---',
              this.suggestedOutfit
            );
          } catch (error) {
            console.error(
              '--- ERROR: Failed to parse or process AI response ---',
              error
            );
            alert(
              'The AI returned an unexpected response. Please check the console.'
            );
          } finally {
            this.isAiLoading = false;
          }
        },
        error: (err: any) => {
          console.error('--- ERROR: The API call failed ---', err);
          alert(
            'An error occurred while contacting the AI service. Check the console.'
          );
          this.isAiLoading = false;
        },
      });
  }

  onSaveOutfitClick(): void {
    if (this.suggestedOutfit.length === 0) return;
    this.showNameInput = true; // فقط نقوم بإظهار حقل الإدخال
  }

  confirmSaveOutfit(): void {
    if (!this.newOutfitName) {
      alert('Please enter a name for your outfit.');
      return;
    }

    // --- أوامر تشخيصية ---
    console.log('--- PREPARING TO SAVE OUTFIT ---');
    console.log('Outfit Name:', this.newOutfitName);
    console.log('Items in suggested outfit:', this.suggestedOutfit);

    // التحقق من أن كل قطعة لها ID
    const itemIds = this.suggestedOutfit.map((item) => item.id);
    if (itemIds.some((id) => !id)) {
      console.error(
        'CRITICAL ERROR: Some items in the suggested outfit are missing an ID.',
        this.suggestedOutfit
      );
      alert('Error: Cannot save outfit because some item data is incomplete.');
      return;
    }
    console.log('Final Item IDs to be saved:', itemIds);
    // --- نهاية الأوامر التشخيصية ---

    this.itemsService
      .saveOutfit(this.newOutfitName, this.suggestedOutfit)
      .then((docRef) => {
        console.log('SUCCESS: Outfit saved with document ID:', docRef.id);
        alert(`Outfit "${this.newOutfitName}" saved successfully!`);
        this.showNameInput = false;
        this.newOutfitName = '';
      })
      .catch((err) => {
        // طباعة الخطأ الكامل في الـ Console
        console.error('--- DETAILED SAVE OUTFIT ERROR ---', err);
        alert(
          'Failed to save outfit. Please check the developer console (F12) for detailed errors.'
        );
      });
  }
}
