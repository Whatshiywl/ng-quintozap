import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import firebase from 'firebase/app';
import 'firebase/auth';

export type UserCredential = firebase.auth.UserCredential;
export type FirebaseUser = firebase.User;

@Injectable()
export class AuthService {
  private readonly googleProvider: firebase.auth.AuthProvider;

  constructor(
    private auth: AngularFireAuth
  ) {
    this.googleProvider = new firebase.auth.GoogleAuthProvider();
  }

  async createUserWithEmailAndPassword(email: string, password: string) {
    const credential = await this.auth.createUserWithEmailAndPassword(email, password);
    if (!credential.user) {
      console.warn('No user found on credential');
      return;
    }
    await credential.user.sendEmailVerification();
    await this.signOut();
    return credential;
  }

  signInWithEmailAndPassword(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  signInWithGooglePopup() {
    return this.auth.signInWithPopup(this.googleProvider);
  }

  async sendPasswordResetEmail(email: string) {
    try {
      return await this.auth.sendPasswordResetEmail(email);
    } catch (error) {
      return;
    }
  }

  signOut() {
    return this.auth.signOut();
  }

  get user() {
    return this.auth.user;
  }

  get currentUser() {
    return this.auth.currentUser;
  }
}
