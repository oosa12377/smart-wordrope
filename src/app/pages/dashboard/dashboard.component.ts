import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ItemsService, Item } from '../../services/items.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User, Auth } from '@angular/fire/auth';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // إضافة ReactiveFormsModule و RouterLink
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  // حقن كل الخدمات المطلوبة
  private itemsService = inject(ItemsService);
  private authService = inject(AuthService);
  private auth = inject(Auth);
  private fb = inject(FormBuilder);
  private storageService = inject(StorageService);

  // --- خصائص لعرض البيانات ---
  currentUser$: Observable<User | null>;
  userWardrobe: Item[] = [];
  templateItems$!: Observable<Item[]>;

  // --- خصائص لفورم المدير (Admin Panel) ---
  adminUid = 'UjifE846uXOMn6QgqwSAqfxcAq42'; // (!!!) هام: استبدل هذا بالـ UID الخاص بحسابك
  templateItemForm!: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;

  // --- خصائص للقوائم المنسدلة ---
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

  constructor() {
    this.currentUser$ = this.authService.authState$;
  }

  ngOnInit(): void {
    // جلب خزانة ملابس المستخدم الحالية (لمعرفة ما يملكه بالفعل)
    this.itemsService
      .getItems()
      .subscribe((items) => (this.userWardrobe = items));
    // جلب قائمة الملابس العامة لعرضها
    this.templateItems$ = this.itemsService.getTemplateItems();

    // تهيئة فورم المدير
    this.templateItemForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      style: ['', Validators.required],
      color: ['', Validators.required],
    });
  }

  /**
   * دالة خاصة بالمستخدم العادي لإضافة قطعة من القائمة العامة إلى خزانته
   */
  addItemFromTemplate(templateItem: Item) {
    const user = this.auth.currentUser;
    if (!user) {
      alert('You must be logged in!');
      return;
    }

    // إنشاء قطعة جديدة بناءً على القالب مع إضافة هوية المستخدم
    const newItem: Item = { ...templateItem };
    delete newItem.id; // نحذف ID القالب لأنه غير ضروري في الخزانة الشخصية
    newItem.uid = user.uid; // نضيف هوية المالك الجديد

    this.itemsService
      .addItem(newItem)
      .then(() => console.log(`${newItem.name} added to your wardrobe!`))
      .catch((err) => console.error(err));
  }

  /**
   * دالة مساعدة للتحقق مما إذا كانت القطعة موجودة بالفعل في خزانة المستخدم
   * (لتغيير حالة زر الإضافة إلى "Added ✓")
   */
  isItemInWardrobe(itemName: string): boolean {
    return this.userWardrobe.some((item) => item.name === itemName);
  }

  // --- دوال خاصة بفورم المدير ---

  /**
   * تلتقط الملف عند اختياره من حقل رفع الصور
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  /**
   * تُنفذ عند الضغط على زر الإضافة في لوحة تحكم المدير
   */
  async onAddTemplateSubmit(): Promise<void> {
    if (this.templateItemForm.invalid || !this.selectedFile) {
      alert('Please fill all fields and select an image.');
      return;
    }
    this.isUploading = true;
    try {
      const imageUrl = await this.storageService.uploadImage(this.selectedFile);
      const newItem: Item = {
        ...this.templateItemForm.value,
        imageUrl: imageUrl,
      };
      // استدعاء الدالة التي تضيف إلى القائمة العامة
      await this.itemsService.addTemplateItem(newItem);

      alert('Template item added successfully!');
      this.templateItemForm.reset();
      this.selectedFile = null;
      const fileInput = document.getElementById(
        'templateFileInput'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error adding template item', error);
      alert('Failed to add template item.');
    } finally {
      this.isUploading = false;
    }
  }
}
