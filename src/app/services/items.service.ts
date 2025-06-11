import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, query, where } from '@angular/fire/firestore';
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
}

@Injectable({
  providedIn: 'root',
})
export class ItemsService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);   

  private itemsCollection = collection(this.firestore, 'items');

  getItems(): Observable<Item[]> {
    const user = this.auth.currentUser;

    if (!user) {
      return of([]);
    }

    const q = query(this.itemsCollection, where("uid", "==", user.uid));
    
    return collectionData(q, { idField: 'id' }) as Observable<Item[]>;
  }

  addItem(item: Item) {
    return addDoc(this.itemsCollection, item);
  }

  deleteItem(itemId: string) {
    const itemDoc = doc(this.firestore, `items/${itemId}`);
    return deleteDoc(itemDoc);
  }
}