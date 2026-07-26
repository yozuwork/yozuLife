import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, signInWithPopup, signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAMiwK9z79xtV1tBRj6Q2ExH4b3YZGvM8Q',
  authDomain: 'yozulife-ffc39.firebaseapp.com',
  projectId: 'yozulife-ffc39',
  storageBucket: 'yozulife-ffc39.firebasestorage.app',
  messagingSenderId: '464412060601',
  appId: '1:464412060601:web:b556bb553f9dcef9462468',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)
export const signOutUser = () => signOut(auth)
