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
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private authService = inject(AuthService);
  private auth = inject(Auth);
  private fb = inject(FormBuilder);
  private storageService = inject(StorageService);

  currentUser$: Observable<User | null>;
  userWardrobe: Item[] = [];
  groupedTemplateItems$!: Observable<{ [key: string]: Item[] }>;

  adminUid = 'UjifE846uXOMn6QgqwSAqfxcAq42'; //  userid admin
  templateItemForm!: FormGroup;
  selectedFile: File | null = null;
  isUploading = false;

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
  objectKeys = Object.keys;

  constructor() {
    this.currentUser$ = this.authService.authState$;
  }

  ngOnInit(): void {
    // Fetch the user's personal wardrobe to check for existing items
    this.itemsService
      .getItems()
      .subscribe((items) => (this.userWardrobe = items));

    // Fetch and group the public template items by category
    this.groupedTemplateItems$ = this.itemsService.getTemplateItems().pipe(
      map((items) => {
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

    // Initialize the admin panel form
    this.templateItemForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      style: ['', Validators.required],
      color: ['', Validators.required],
    });
  }

  // --- Methods for Regular Users ---

  /** Adds a template item to the user's personal wardrobe */
  addItemFromTemplate(templateItem: Item) {
    const user = this.auth.currentUser;
    if (!user) {
      alert('You must be logged in!');
      return;
    }
    const newItem: Item = { ...templateItem };
    newItem.templateId = templateItem.id; // Save the original template ID
    delete newItem.id; // Delete the original ID before creating a new document
    newItem.uid = user.uid;

    this.itemsService
      .addItem(newItem)
      .then(() => console.log(`${newItem.name} added to your wardrobe!`))
      .catch((err) => console.error(err));
  }

  /** Checks if a template item is already in the user's wardrobe */
  isItemInWardrobe(templateId: string | undefined): boolean {
    if (!templateId) return false;
    return this.userWardrobe.some((item) => item.templateId === templateId);
  }

  // --- Methods for the Admin Panel ---

  /** Captures the selected file from the admin form's file input */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  /** Handles the submission of the admin's "Add Template" form */
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

  /** Handles the deletion of a public template item (admin only) */
  onDeleteTemplateItem(templateId: string | undefined): void {
    if (!templateId) {
      console.error('Template ID is missing.');
      return;
    }
    if (
      confirm(
        'Are you sure you want to permanently delete this public template item?'
      )
    ) {
      this.itemsService
        .deleteTemplateItem(templateId)
        .then(() => console.log('Template item deleted successfully!'))
        .catch((err) => {
          console.error('Error deleting template item:', err);
          alert('Failed to delete template item.');
        });
    }
  }
}
