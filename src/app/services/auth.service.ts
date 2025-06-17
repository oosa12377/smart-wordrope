import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  authState,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  where,
  query,
  collection,
  getDocs,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private router: Router = inject(Router);

  authState$ = authState(this.auth);

  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(email: string, password: string, displayName: string) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: 'user',
      createdAt: new Date(),
    });

    return userCredential;
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(this.auth, provider);
    const user = userCredential.user;

    const userDocRef = doc(this.firestore, `users/${user.uid}`);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user',
        createdAt: new Date(),
      });
    }
    return userCredential;
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    console.log(
      `[DEBUG] 1. Starting sendPasswordResetEmail with email: "${email}"`
    );

    const usersCollection = collection(this.firestore, 'users');
    console.log('[DEBUG] 2. Created collection reference for "users".');

    const q = query(usersCollection, where('email', '==', email));
    console.log(
      '[DEBUG] 3. Created query to find where email equals the input.'
    );

    try {
      console.log('[DEBUG] 4. Executing the query against Firestore...');
      const querySnapshot = await getDocs(q);
      console.log(
        `[DEBUG] 5. Query finished. Found ${querySnapshot.size} documents.`
      );

      if (querySnapshot.empty) {
        console.log(
          '[DEBUG] 6a. Snapshot is empty. Throwing custom "auth/user-not-found" error.'
        );
        throw new Error('auth/user-not-found');
      } else {
        console.log(
          '[DEBUG] 6b. Snapshot is NOT empty. Proceeding to send reset email.'
        );
        return sendPasswordResetEmail(this.auth, email);
      }
    } catch (firestoreError) {
      console.error(
        '[DEBUG] !!! A DIRECT FIRESTORE ERROR OCCURRED:',
        firestoreError
      );
      throw firestoreError;
    }
  }

  logout() {
    return signOut(this.auth).then(() => {
      this.router.navigate(['/login']);
    });
  }
}
