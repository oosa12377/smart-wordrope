import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsService, Item } from '../../services/items.service';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-outfit-suggester',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './outfit-suggester.component.html',
  styleUrls: ['./outfit-suggester.component.css'],
})
export class OutfitSuggesterComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private geminiService = inject(GeminiService);

  allItems: Item[] = [];
  suggestedOutfit: Item[] = [];
  isLoading = true;
  isAiLoading = false;

  ngOnInit(): void {
    this.itemsService.getItems().subscribe((items) => {
      this.allItems = items;
      this.isLoading = false;
    });
  }

  /**
   * ## 2. ميزة الاقتراح العشوائي المطور (حسب الستايل)
   */
  suggestOutfit(): void {
    if (this.allItems.length < 2) {
      alert('You need more items to get a good suggestion.');
      return;
    }

    // 1. احصل على كل الستايلات المتاحة في الخزانة بدون تكرار
    const availableStyles = [
      ...new Set(this.allItems.map((item) => item.style).filter(Boolean)),
    ];
    if (availableStyles.length === 0) {
      alert('Please add styles to your items for better suggestions.');
      return;
    }

    // 2. اختر ستايل واحد بشكل عشوائي
    const randomStyle =
      availableStyles[Math.floor(Math.random() * availableStyles.length)];
    console.log(`Suggesting a "${randomStyle}" outfit...`);

    // 3. قم بفلترة الملابس التي تنتمي لهذا الستايل فقط
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
        `Could not find a complete outfit for the style "${randomStyle}". Please add more items or try again.`
      );
      return;
    }

    // 4. اختر قطعة عشوائية من كل قائمة отфильтрованная
    const randomTop = tops[Math.floor(Math.random() * tops.length)];
    const randomBottom = bottoms[Math.floor(Math.random() * bottoms.length)];

    const suggested = [randomTop, randomBottom];

    // إذا كانت هناك أحذية متاحة بنفس الستايل، أضف قطعة منها
    if (shoes.length > 0) {
      const randomShoes = shoes[Math.floor(Math.random() * shoes.length)];
      suggested.push(randomShoes);
    }

    this.suggestedOutfit = suggested;
  }

  /**
   * ## 3. ميزة الاقتراح بالذكاء الاصطناعي مع إصلاح الخطأ
   */
  suggestOutfitWithAi(): void {
    if (this.allItems.length < 3) {
      /* ... */
    }
    this.isAiLoading = true;
    this.suggestedOutfit = [];

    this.geminiService.generateOutfitSuggestion(this.allItems).subscribe({
      next: (response: any) => {
        try {
          let responseText = response.candidates[0].content.parts[0].text;
          responseText = responseText
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          const suggestedItemNames: string[] = JSON.parse(responseText);

          // --- (2) هذا هو فلتر الأمان الجديد ---
          // ابحث عن كل القطع التي اقترحها الـ AI
          const rawAiItems = this.allItems.filter((item) =>
            suggestedItemNames.includes(item.name)
          );

          // الآن، اختر قطعة واحدة فقط من كل نوع مطلوب
          const finalTop = rawAiItems.find((item) => item.type === 'Top');
          const finalBottom = rawAiItems.find((item) => item.type === 'Bottom');
          const finalShoes = rawAiItems.find((item) => item.type === 'Shoes');

          // قم بتجميع الطقم النهائي وتجاهل أي قيم فارغة (إذا لم يجد نوعًا معينًا)
          this.suggestedOutfit = [finalTop, finalBottom, finalShoes].filter(
            Boolean
          ) as Item[];

          // تحقق إذا كان الطقم غير مكتمل
          if (this.suggestedOutfit.length < 3) {
            console.warn('AI suggestion was incomplete after filtering.');
            // يمكنك هنا إظهار رسالة للمستخدم أو محاولة اقتراح عشوائي كخطة بديلة
          }
        } catch (error) {
          console.error('Error parsing AI response:', error);
          alert('The AI returned an unexpected response. Please try again.');
        } finally {
          this.isAiLoading = false;
        }
      },
      error: (err: any) => {
        /* ... */
      },
    });
  }
}
