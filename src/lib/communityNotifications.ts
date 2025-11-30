import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export class CommunityNotificationService {
  private static instance: CommunityNotificationService;
  
  static getInstance(): CommunityNotificationService {
    if (!CommunityNotificationService.instance) {
      CommunityNotificationService.instance = new CommunityNotificationService();
    }
    return CommunityNotificationService.instance;
  }

  async initializePushNotifications(userId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only work on native platforms');
      return;
    }

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive === 'granted') {
        // Register with FCM
        await PushNotifications.register();
        
        // Listen for registration
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token: ' + token.value);
          await this.saveFCMToken(userId, token.value);
        });

        // Handle errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Handle notifications received while app is open
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ' + JSON.stringify(notification));
        });

        // Handle notification tapped
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', JSON.stringify(notification));
        });
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  private async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      // Check if token already exists
      const tokensRef = collection(db, 'fcmTokens');
      const q = query(tokensRef, where('userId', '==', userId), where('token', '==', token));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(tokensRef, {
          userId,
          token,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Update timestamp
        const docRef = doc(db, 'fcmTokens', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  async trackPostInteraction(userId: string, postId: string): Promise<void> {
    try {
      const interactionsRef = collection(db, 'postInteractions');
      
      // Check if interaction already exists
      const q = query(
        interactionsRef,
        where('userId', '==', userId),
        where('postId', '==', postId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addDoc(interactionsRef, {
          userId,
          postId,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error tracking post interaction:', error);
    }
  }

  async getInterestedUsers(postId: string, excludeUserId: string): Promise<string[]> {
    try {
      const interactionsRef = collection(db, 'postInteractions');
      const q = query(interactionsRef, where('postId', '==', postId));
      const querySnapshot = await getDocs(q);
      
      const userIds = new Set<string>();
      querySnapshot.forEach((doc) => {
        const userId = doc.data().userId;
        if (userId !== excludeUserId) {
          userIds.add(userId);
        }
      });
      
      return Array.from(userIds);
    } catch (error) {
      console.error('Error getting interested users:', error);
      return [];
    }
  }

  async getFCMTokensForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    
    try {
      const tokensRef = collection(db, 'fcmTokens');
      const q = query(tokensRef, where('userId', 'in', userIds));
      const querySnapshot = await getDocs(q);
      
      const tokens: string[] = [];
      querySnapshot.forEach((doc) => {
        tokens.push(doc.data().token);
      });
      
      return tokens;
    } catch (error) {
      console.error('Error getting FCM tokens:', error);
      return [];
    }
  }
}

export const communityNotifications = CommunityNotificationService.getInstance();
