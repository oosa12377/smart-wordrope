import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);

  getItemsMaster() {
    const itemsCollection = collection(this.firestore, 'itemMster');
    return collectionData(itemsCollection, { idField: 'id' });
  }

  async addUserClothing(userId: string, clothingData: any): Promise<void> {
    const userClothesCollection = collection(this.firestore, `users/${userId}/clothes`);
    await addDoc(userClothesCollection, {
      ...clothingData,
      addedAt: serverTimestamp()
    });
  }

  async addItemWithSeasons(type: string, colors: any[], seasons: string[]): Promise<void> {
    const preparedColors = await Promise.all(
      colors.map(async (color) => {
        const imageFiles = Array.isArray(color.imageFiles) ? color.imageFiles : [];
        const imageUrls = await Promise.all(
          imageFiles.map((file: File) => this.uploadImage(file))
        );
        return { name: color.name, style: color.style, images: imageUrls };
      })
    );

    const docRef = doc(this.firestore, 'itemMster', type);
    return await setDoc(docRef, { colors: preparedColors, seasons: seasons });
  }

  private async uploadImage(file: File): Promise<string> {
    const path = `clothes/${uuidv4()}_${file.name}`;
    const storageRef = ref(this.storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
}