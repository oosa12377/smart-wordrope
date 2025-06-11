import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ItemsService, Item } from '../../services/items.service';
import { StorageService } from '../../services/storage.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-add-clothes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-clothes.component.html',
  styleUrls: ['./add-clothes.component.css'],
})
export class AddClothesComponent implements OnInit {
  private itemsService = inject(ItemsService);
  private fb = inject(FormBuilder);
  private storageService = inject(StorageService);
  private auth = inject(Auth);

  itemTypes: string[] = ['Top', 'Bottom', 'Shoes', 'Jacket', 'Accessory'];
  styles: string[] = ['Casual', 'Formal', 'Sport', 'Smart Casual', 'Vintage'];
  colors: string[] = ['Black', 'White', 'Blue', 'Red', 'Green', 'Beige', 'Gray', 'Brown', 'Pink'];
  
  items$!: Observable<Item[]>;
  addItemForm!: FormGroup;
  isLoading = false;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.addItemForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required], 
      style: ['', Validators.required],
      color: ['', Validators.required],
    });
    this.fetchItems();
  }
  
  fetchItems(): void {
    this.items$ = this.itemsService.getItems();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit(): Promise<void> {
    const currentUser = this.auth.currentUser;

    if (this.addItemForm.invalid || !this.selectedFile) {
      alert('Please fill all fields and select an image.');
      return;
    }
    if (!currentUser) {
      alert('You must be logged in to add items.');
      return;
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
      
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  onDelete(itemId: string | undefined): void {
    if (!itemId) return;

    if (confirm('Are you sure you want to delete this item?')) {
      this.itemsService.deleteItem(itemId)
        .then(() => console.log('Item deleted successfully!'))
        .catch(err => console.error('Error deleting item:', err));
    }
  }
}