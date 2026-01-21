import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'reply_to_post' | 'reply_to_participated';
  postId: string;
  postPreview: string;
  fromUserId: string;
  fromUsername: string;
  fromProfilePic?: string;
  toUserId: string;
  read: boolean;
  timestamp: Timestamp;
  replyPreview: string;
}

interface NotificationBellProps {
  onNotificationClick: (postId: string) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationClick }) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('toUserId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true,
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate to the post
    onNotificationClick(notification.postId);
    setOpen(false);
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter((n) => !n.read);
    try {
      await Promise.all(
        unreadNotifs.map((n) =>
          updateDoc(doc(db, 'notifications', n.id), { read: true })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: language === 'ar' ? ar : enUS,
    });
  };

  const getNotificationMessage = (notification: Notification) => {
    if (notification.type === 'reply_to_post') {
      return t('repliedToYourPost') || 'replied to your post';
    }
    return t('repliedToConversation') || 'replied to a conversation you participated in';
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align={language === 'ar' ? 'start' : 'end'}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">
            {t('notifications') || 'Notifications'}
          </h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              {t('markAllRead') || 'Mark all read'}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4 text-muted-foreground text-sm">
              {t('noNotifications') || 'No notifications yet'}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-3 text-left hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {notification.fromProfilePic ? (
                        <img
                          src={notification.fromProfilePic}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-purple-700">
                            {notification.fromUsername?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {notification.fromUsername}
                        </span>{' '}
                        <span className="text-muted-foreground">
                          {getNotificationMessage(notification)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        "{notification.replyPreview}"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTime(notification.timestamp)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-purple-500" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
