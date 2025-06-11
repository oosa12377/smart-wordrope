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

  constructor() {}

  // الدالة التي تأخذ قائمة الملابس وترسلها للـ AI
  generateOutfitSuggestion(items: Item[]): Observable<any> {
    // 1. نقوم بتجهيز بيانات الملابس لإرسالها (نختار فقط الحقول المهمة)
    const simplifiedItems = items.map((item) => ({
      name: item.name,
      type: item.type,
      color: item.color,
      style: item.style,
    }));

    // 2. نقوم ببناء السؤال (Prompt) الذي سيفهمه الذكاء الاصطناعي
    const prompt = `
    You are an expert fashion stylist.
    Based on the following list of available clothes in JSON format, suggest a complete and stylish outfit.

    The outfit MUST contain EXACTLY ONE item of type 'Top', EXACTLY ONE item of type 'Bottom', and EXACTLY ONE item of type 'Shoes'.
    
    Here are the available clothes:
    ${JSON.stringify(simplifiedItems)}

    Your response MUST be ONLY a valid JSON array of strings containing the exact 'name' of the three selected items.
    Example of a perfect response: ["Classic Blue Jeans", "White Cotton T-Shirt", "Black Leather Sneakers"]
    Do NOT include more than one item of the same type. Do not include any other text, explanation, or markdown formatting.
  `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    return this.http.post<any>(this.apiUrl, requestBody);
  }
}
