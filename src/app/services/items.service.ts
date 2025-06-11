import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  deleteDoc,
  query,
  where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';

// The Item interface remains the same
export interface Item {
  id?: string;
  name: string;
  type: string;
  imageUrl: string;
  style?: string;
  color?: string;
  uid?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  private itemsCollection = collection(this.firestore, 'items');
  private templateItemsCollection = collection(this.firestore, 'templateItems');

  // Fetches the current user's items
  getItems(): Observable<Item[]> {
    const user = this.auth.currentUser;
    if (!user) {
      return of([]);
    }
    const q = query(this.itemsCollection, where('uid', '==', user.uid));
    return collectionData(q, { idField: 'id' }) as Observable<Item[]>;
  }

  // Fetches the public template items
  getTemplateItems(): Observable<Item[]> {
    return collectionData(this.templateItemsCollection, {
      idField: 'id',
    }) as Observable<Item[]>;
  }

  // Adds an item to the user's personal wardrobe
  addItem(item: Item) {
    return addDoc(this.itemsCollection, item);
  }

  // Adds an item to the public template collection
  addTemplateItem(item: Item) {
    return addDoc(this.templateItemsCollection, item);
  }

  // Deletes an item from the user's personal wardrobe
  deleteItem(itemId: string) {
    const itemDoc = doc(this.firestore, `items/${itemId}`);
    return deleteDoc(itemDoc);
  }
}
