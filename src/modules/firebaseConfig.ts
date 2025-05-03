import { FirebaseApp, initializeApp } from 'firebase/app';
import { FirebaseConfig } from '../types/firebase';
import { logger } from '../utils/logger';
import { eventBus } from '../utils/eventBus';

class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp | null = null;

  private readonly config: FirebaseConfig = {
    apiKey: "AIzaSyCP68k3zEBW4X0mfFKF9uy5JrAaBoMJQWE",
    authDomain: "whatsapp-orcamentos.firebaseapp.com",
    projectId: "whatsapp-orcamentos",
    storageBucket: "whatsapp-orcamentos.firebasestorage.app",
    messagingSenderId: "810212534991",
    appId: "1:810212534991:web:9a4e05a65ca4d7c192e5ba"
  };

  private constructor() {
    this.initializeFirebase();
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  private initializeFirebase(): void {
    try {
      this.app = initializeApp(this.config);
      logger.info('Firebase initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase', error);
      eventBus.emit('error:occurred', {
        code: 'FIREBASE_INIT_ERROR',
        message: 'Failed to initialize Firebase',
        details: error,
        timestamp: Date.now()
      });
    }
  }

  public getApp(): FirebaseApp {
    if (!this.app) {
      throw new Error('Firebase app not initialized');
    }
    return this.app;
  }
}

export const firebaseService = FirebaseService.getInstance(); 