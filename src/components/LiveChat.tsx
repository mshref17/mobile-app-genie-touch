import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Flag, MoreVertical, Reply, Trash2, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  serverTimestamp,
  where,
  Timestamp,
  limit,
  setDoc,
  getDocs
} from 'firebase/firestore';

interface ChatMessage {
  id: string;
  content: string;
  timestamp: any;
  nickname: string;
  authorId: string;
  profilePic?: string;
  replyTo?: {
    id: string;
    content: string;
    nickname: string;
  };
}

interface LiveChatProps {
  onOnlineCountChange?: (count: number) => void;
}

const LiveChat = ({ onOnlineCountChange }: LiveChatProps) => {
  const { t } = useLanguage();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceDocId = useRef<string | null>(null);
  const { toast } = useToast();

  const MESSAGES_LIMIT = 100;
  const MESSAGE_EXPIRY_HOURS = 48;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Presence tracking - mark user as online when viewing chat
  useEffect(() => {
    const PRESENCE_TIMEOUT = 2 * 60 * 1000; // 2 minutes
    
    const markOnline = async () => {
      try {
        const sessionId = `${user?.uid || 'anon'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        presenceDocId.current = sessionId;
        
        await setDoc(doc(db, 'chat_presence', sessionId), {
          odentifier: user?.uid || 'anonymous',
          timestamp: serverTimestamp(),
          nickname: userProfile?.username || 'Guest'
        });
      } catch (error) {
        console.error('Error marking presence:', error);
      }
    };

    const cleanupPresence = async () => {
      if (presenceDocId.current) {
        try {
          await deleteDoc(doc(db, 'chat_presence', presenceDocId.current));
        } catch (error) {
          console.error('Error cleaning up presence:', error);
        }
      }
    };

    markOnline();

    // Refresh presence every minute to stay "online"
    const refreshInterval = setInterval(markOnline, 60 * 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(refreshInterval);
      cleanupPresence();
    };
  }, [user?.uid, userProfile?.username]);

  // Listen to online users count
  useEffect(() => {
    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

    const q = query(collection(db, 'chat_presence'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      
      let count = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (timestamp > twoMinutesAgo) {
          count++;
        }
      });
      
      setOnlineCount(count);
      onOnlineCountChange?.(count);
    }, (error) => {
      console.error('Error listening to presence:', error);
    });

    return () => unsubscribe();
  }, [onOnlineCountChange]);

  // Load messages with real-time updates (only messages from last 48 hours)
  useEffect(() => {
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - MESSAGE_EXPIRY_HOURS);
    
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'asc'),
      limit(MESSAGES_LIMIT)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: ChatMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter out expired messages client-side
        const msgTime = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (msgTime > expiryTime) {
          msgs.push({ 
            id: doc.id, 
            content: data.content || '',
            timestamp: data.timestamp,
            nickname: data.nickname || '',
            authorId: data.authorId || '',
            profilePic: data.profilePic || '',
            replyTo: data.replyTo || null
          });
        }
      });
      
      setMessages(msgs);
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      console.error('Error loading chat messages:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!user || !userProfile) {
      navigate('/login');
      return;
    }

    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const messageData: any = {
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        nickname: userProfile.username,
        authorId: user.uid,
        profilePic: userProfile.profilePic || ''
      };

      if (replyingTo) {
        messageData.replyTo = {
          id: replyingTo.id,
          content: replyingTo.content.substring(0, 100),
          nickname: replyingTo.nickname
        };
      }
      
      await addDoc(collection(db, 'chat_messages'), messageData);
      
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t("error") || "Error",
        description: t("messageSendError") || "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReportMessage = async () => {
    if (!user || !reportingMessageId || !reportReason) {
      if (!reportReason) {
        toast({
          title: t("selectReportReason"),
          variant: "destructive"
        });
      }
      return;
    }
    
    setReportSubmitting(true);
    try {
      const message = messages.find(m => m.id === reportingMessageId);
      
      const reportData = {
        messageId: reportingMessageId,
        reporterId: user.uid,
        reason: reportReason,
        timestamp: serverTimestamp(),
        status: 'pending',
        messageContent: message?.content || '',
        messageAuthorId: message?.authorId || '',
        type: 'chat_message'
      };
      
      await addDoc(collection(db, 'reports'), reportData);
      
      toast({
        title: t("reportSubmitted"),
        description: t("reportSubmittedDescription"),
      });
      
      setReportDialogOpen(false);
      setReportingMessageId(null);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting message:', error);
      toast({
        title: t("error"),
        description: t("reportError"),
        variant: "destructive"
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'chat_messages', messageId));
      
      toast({
        title: t("messageDeleted") || "Message deleted",
      });
      
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: t("deleteFailed"),
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return t("justNow") || "Just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}${t("minutesAgo") || "m"}`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}${t("hoursAgo") || "h"}`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}${t("daysAgo") || "d"}`;
    }
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-pink-100');
      setTimeout(() => {
        element.classList.remove('bg-pink-100');
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDelete") || "Delete Message?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteMessageConfirm") || "This action cannot be undone. This will permanently delete your message."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmId && handleDeleteMessage(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("delete") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reportMessageTitle") || "Report Message"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reportMessageDescription") || "Please select a reason for reporting this message."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RadioGroup value={reportReason} onValueChange={setReportReason}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spam" id="chat-spam" />
              <Label htmlFor="chat-spam" className="cursor-pointer">{t("reportReasonSpam")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="harassment" id="chat-harassment" />
              <Label htmlFor="chat-harassment" className="cursor-pointer">{t("reportReasonHarassment")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inappropriate" id="chat-inappropriate" />
              <Label htmlFor="chat-inappropriate" className="cursor-pointer">{t("reportReasonInappropriate")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hate" id="chat-hate" />
              <Label htmlFor="chat-hate" className="cursor-pointer">{t("reportReasonHateSpeech")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="chat-other" />
              <Label htmlFor="chat-other" className="cursor-pointer">{t("reportReasonOther")}</Label>
            </div>
          </RadioGroup>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reportSubmitting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReportMessage}
              disabled={reportSubmitting || !reportReason}
              className="bg-red-600 hover:bg-red-700"
            >
              {reportSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {reportSubmitting ? t("submitting") || "Submitting..." : t("submitReport")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-lg">
        <div>
          <h3 className="font-semibold text-pink-800">{t("liveChat") || "Live Chat"}</h3>
          <p className="text-xs text-muted-foreground">
            {t("chatExpiry") || "Messages expire after 48 hours"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-700">
              {onlineCount} {t("online") || "online"}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {messages.length} {t("messages") || "messages"}
          </Badge>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-3/4 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>{t("noMessages") || "No messages yet. Start the conversation!"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwnMessage = user?.uid === message.authorId;
              
              return (
                <div 
                  key={message.id} 
                  id={`message-${message.id}`}
                  className={`flex gap-2 transition-colors duration-500 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  {message.profilePic ? (
                    <img 
                      src={message.profilePic} 
                      alt={message.nickname}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-purple-700">
                        {message.nickname?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-purple-700">
                        {message.nickname}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(message.timestamp)}
                      </span>
                    </div>

                    {/* Reply Reference */}
                    {message.replyTo && (
                      <div 
                        onClick={() => scrollToMessage(message.replyTo!.id)}
                        className="text-xs bg-muted/50 px-2 py-1 rounded mb-1 cursor-pointer hover:bg-muted border-l-2 border-pink-400"
                      >
                        <span className="font-medium text-pink-600">{message.replyTo.nickname}</span>
                        <p className="text-muted-foreground truncate max-w-[200px]">
                          {message.replyTo.content}
                        </p>
                      </div>
                    )}

                    <div className={`group flex items-center gap-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      <div className={`px-3 py-2 rounded-2xl ${
                        isOwnMessage 
                          ? 'bg-pink-500 text-white rounded-br-md' 
                          : 'bg-muted rounded-bl-md'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      </div>

                      {/* Message Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwnMessage ? "start" : "end"} className="bg-background">
                          <DropdownMenuItem 
                            onClick={() => setReplyingTo(message)}
                            className="cursor-pointer"
                          >
                            <Reply className="w-4 h-4 mr-2" />
                            {t("reply") || "Reply"}
                          </DropdownMenuItem>
                          {!isOwnMessage && (
                            <DropdownMenuItem 
                              onClick={() => {
                                setReportingMessageId(message.id);
                                setReportDialogOpen(true);
                              }}
                              className="cursor-pointer text-orange-600 focus:text-orange-600"
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              {t("report") || "Report"}
                            </DropdownMenuItem>
                          )}
                          {isOwnMessage && (
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmId(message.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("delete") || "Delete"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-1 h-8 bg-pink-500 rounded-full" />
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-pink-600">{t("replyingTo") || "Replying to"} {replyingTo.nickname}</p>
              <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setReplyingTo(null)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        {!user ? (
          <Button 
            onClick={() => navigate('/login')} 
            className="w-full bg-pink-600 hover:bg-pink-700"
          >
            {t("loginToChat") || "Login to chat"}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder={t("typeMessage") || "Type a message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-pink-600 hover:bg-pink-700"
              size="icon"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
