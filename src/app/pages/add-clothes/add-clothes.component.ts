import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
// (1) --- تم استيراد 'Outfit' هنا ---
import { ItemsService, Item, Outfit } from '../../services/items.service';
import { StorageService } from '../../services/storage.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-add-clothes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-clothes.component.html',
  styleUrls: ['./add-clothes.component.css'],
})
export class AddClothesComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private fb = inject(FormBuilder);
  private storageService = inject(StorageService);
  private auth = inject(Auth);

  // --- خصائص القوائم المنسدلة ---
  itemTypes: string[] = ['Top', 'Bottom', 'Shoes', 'Jacket', 'Accessory'];
  styles: string[] = ['Casual', 'Formal', 'Sport', 'Smart Casual', 'Vintage'];
  colors: string[] = [
    'Black',
    'White',
    'Blue',
    'Red',
    'Green',
    'Beige',
    'Gray',
    'Brown',
    'Pink',
  ];

  // --- خصائص لعرض البيانات ---
  groupedItems$!: Observable<{ [key: string]: Item[] }>;
  savedOutfits$!: Observable<Outfit[]>;
  allItems: Item[] = []; // سنحتاجها للبحث عن تفاصيل الملابس

  // --- خصائص الفورم والحالة ---
  addItemForm!: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;
  objectKeys = Object.keys;

  ngOnInit(): void {
    // تهيئة فورم إضافة قطعة جديدة
    this.addItemForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      style: ['', Validators.required],
      color: ['', Validators.required],
    });
    // (2) --- استدعاء دالة واحدة لجلب كل البيانات ---
    this.fetchData();
  }

  /**
   * (3) --- دالة واحدة واضحة لجلب وتجهيز كل البيانات اللازمة للصفحة ---
   */
  fetchData(): void {
    // أولاً: جلب وعرض الأطقم المحفوظة
    this.savedOutfits$ = this.itemsService.getOutfits();

    // ثانياً: جلب وتجميع الملابس الشخصية
    this.groupedItems$ = this.itemsService.getItems().pipe(
      map((items) => {
        // نحفظ القائمة الكاملة للملابس لاستخدامها لاحقًا
        this.allItems = items;
        // نقوم بعملية التجميع
        return items.reduce((accumulator, currentItem) => {
          const key = currentItem.type || 'Uncategorized';
          if (!accumulator[key]) {
            accumulator[key] = [];
          }
          accumulator[key].push(currentItem);
          return accumulator;
        }, {} as { [key: string]: Item[] });
      })
    );
  }

  /**
   * (4) --- دوال جديدة للتعامل مع الأطقم المحفوظة ---
   */
  getItemById(itemId: string): Item | undefined {
    return this.allItems.find((item) => item.id === itemId);
  }

  onDeleteOutfit(outfitId: string | undefined) {
    if (!outfitId) return;
    if (confirm('Are you sure you want to delete this saved outfit?')) {
      this.itemsService
        .deleteOutfit(outfitId)
        .then(() => console.log('Outfit deleted!'))
        .catch((err) => console.error(err));
    }
  }

  // --- دوال إضافة وحذف قطعة ملابس (تبقى كما هي) ---
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  async onSubmit(): Promise<void> {
    const currentUser = this.auth.currentUser;
    if (this.addItemForm.invalid || !this.selectedFile) {
      /* ... */ return;
    }
    if (!currentUser) {
      /* ... */ return;
    }
    this.isLoading = true;
    try {
      const imageUrl = await this.storageService.uploadImage(this.selectedFile);
      const formValue = this.addItemForm.value;
      const newItem: Item = {
        name: formValue.name,
        type: formValue.type,
        style: formValue.style,
        color: formValue.color,
        imageUrl: imageUrl,
        uid: currentUser.uid,
      };
      await this.itemsService.addItem(newItem);
      console.log('Item added successfully!');
      this.addItemForm.reset();
      this.selectedFile = null;
      const fileInput = document.getElementById(
        'fileInput'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item.');
    } finally {
      this.isLoading = false;
    }
  }

  onDelete(itemId: string | undefined): void {
    if (!itemId) return;
    if (confirm('Are you sure you want to delete this item?')) {
      this.itemsService
        .deleteItem(itemId)
        .then(() => console.log('Item deleted successfully!'))
        .catch((err) => console.error('Error deleting item:', err));
    }
  }
}
