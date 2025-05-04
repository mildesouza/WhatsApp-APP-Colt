import { initializeApp } from 'firebase/app';

export const firebaseConfig = {
  apiKey: "AIzaSyCP68k3zEBW4X0mfFKF9uy5JrAaBoMJQWE",
  authDomain: "whatsapp-orcamentos.firebaseapp.com",
  projectId: "whatsapp-orcamentos",
  storageBucket: "whatsapp-orcamentos.firebasestorage.app",
  messagingSenderId: "810212534991",
  appId: "1:810212534991:web:9a4e05a65ca4d7c192e5ba"
};

export const firebaseApp = initializeApp(firebaseConfig); 