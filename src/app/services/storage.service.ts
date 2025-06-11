import { Injectable, inject } from '@angular/core';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage: Storage = inject(Storage);

  constructor() {}

  async uploadImage(file: File): Promise<string> {
    const filePath = `items/${uuidv4()}.${file.name.split('.').pop()}`;
    const storageRef = ref(this.storage, filePath);

    const uploadTask = await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(uploadTask.ref);

    return downloadURL;
  }
}