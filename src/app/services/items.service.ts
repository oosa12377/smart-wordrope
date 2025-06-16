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

export interface Item {
  id?: string;
  name: string;
  type: string;
  imageUrl: string;
  style?: string;
  color?: string;
  uid?: string;
  templateId?: string;
}

export interface Outfit {
  id?: string;
  uid: string;
  name: string;
  itemIds: string[];
  createdAt: any;
}

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  private itemsCollection = collection(this.firestore, 'items');
  private templateItemsCollection = collection(this.firestore, 'templateItems');
  private outfitsCollection = collection(this.firestore, 'outfits');

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

  //outfit
  getOutfits(): Observable<Outfit[]> {
    const user = this.auth.currentUser;
    if (!user) {
      return of([]);
    }
    const q = query(this.outfitsCollection, where('uid', '==', user.uid));
    return collectionData(q, { idField: 'id' }) as Observable<Outfit[]>;
  }
  saveOutfit(name: string, items: Item[]): Promise<any> {
    const user = this.auth.currentUser;
    if (!user) {
      return Promise.reject('User not logged in');
    }

    // نحصل فقط على IDs قطع الملابس
    const itemIds = items.map((item) => item.id).filter((id) => id) as string[];

    const newOutfit: Outfit = {
      uid: user.uid,
      name: name,
      itemIds: itemIds,
      createdAt: new Date(), // يحفظ تاريخ إنشاء الطقم
    };

    return addDoc(this.outfitsCollection, newOutfit);
  }

  /** يحذف طقمًا محفوظًا */
  deleteOutfit(outfitId: string): Promise<void> {
    const outfitDoc = doc(this.firestore, `outfits/${outfitId}`);
    return deleteDoc(outfitDoc);
  }

  //end

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

  // Deletes an item from the public template collection
  deleteTemplateItem(templateId: string) {
    const itemDoc = doc(this.firestore, `templateItems/${templateId}`);
    return deleteDoc(itemDoc);
  }
}
