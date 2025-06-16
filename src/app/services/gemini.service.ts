import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Item } from './items.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private http = inject(HttpClient);
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${environment.geminiApiKey}`;

  // (1) الدالة الآن تستقبل طلب المستخدم
  generateOutfitSuggestion(
    items: Item[],
    userRequest: string
  ): Observable<any> {
    const simplifiedItems = items.map((item) => ({
      name: item.name,
      type: item.type,
      color: item.color,
      style: item.style,
    }));

    const prompt = `
    You are a bilingual fashion stylist, fluent in English and Arabic.
    Your primary goal is to fulfill the user's request with high accuracy.
    The user will make a request in either English or Arabic. You must understand their request and provide the justification in the SAME LANGUAGE as the user's request.

    A user needs an outfit for this occasion: "${
      userRequest || 'any occasion'
    }".

    The outfit MUST contain EXACTLY ONE 'Top', 'Bottom', and 'Shoes'.
    The clothing data is in English, so your "outfit" array MUST use the English names from the data provided.

    Here is the clothing data in JSON format:
    ${JSON.stringify(simplifiedItems)}

    Your response MUST be ONLY a single, valid JSON object with two keys: "outfit" and "justification".

    Example of an Arabic response if the user asks in Arabic:
    {
      "outfit": ["White Cotton T-Shirt", "Classic Blue Jeans", "White Leather Sneakers"],
      "justification": "هذا طقم كاجوال ومريح ومثالي ليوم مشمس. التي شيرت الأبيض يجعله منعشًا، بينما الجينز الأزرق قطعة كلاسيكية. الحذاء الرياضي الأبيض يكمل المظهر بأسلوب نظيف وبسيط."
    }
  `;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 },
    };

    return this.http.post<any>(this.apiUrl, requestBody);
  }
}
