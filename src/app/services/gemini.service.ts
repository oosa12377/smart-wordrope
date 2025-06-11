import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Item } from './items.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private http = inject(HttpClient);
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${environment.geminiApiKey}`;

  constructor() { }

  // الدالة التي تأخذ قائمة الملابس وترسلها للـ AI
  generateOutfitSuggestion(items: Item[]): Observable<any> {
    // 1. نقوم بتجهيز بيانات الملابس لإرسالها (نختار فقط الحقول المهمة)
    const simplifiedItems = items.map(item => ({
      name: item.name,
      type: item.type,
      color: item.color,
      style: item.style
    }));

    // 2. نقوم ببناء السؤال (Prompt) الذي سيفهمه الذكاء الاصطناعي
    const prompt = `
      You are an expert fashion stylist.
      Based on the following list of available clothes in JSON format, please suggest a complete and stylish outfit that includes one 'Top', one 'Bottom', and one 'Shoes'.

      Here are the available clothes:
      ${JSON.stringify(simplifiedItems)}

      Your response MUST be ONLY a valid JSON array of strings, where each string is the exact 'name' of a selected clothing item from the provided list.
      For example: ["Classic Blue Jeans", "White Cotton T-Shirt", "Black Leather Sneakers"]
      Do not include any other text, explanation, or markdown formatting like \`\`\`json.
    `;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    return this.http.post<any>(this.apiUrl, requestBody);
  }
}