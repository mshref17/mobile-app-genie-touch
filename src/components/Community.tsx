import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, MessageCircle, Camera, Video, Send, Loader2, TrendingUp, Clock, MessageSquare, Shuffle, Plus, LogOut, Flag, Edit, Trash2, MoreVertical, MessagesSquare } from "lucide-react";
import LiveChat from "@/components/LiveChat";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  increment,
  serverTimestamp,
  getDocs,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


interface Post {
  id: string;
  content: string;
  timestamp: any;
  likes: number;
  replies: number;
  attachments?: string[];
  nickname: string;
  authorId: string;
  profilePic?: string;
}

interface Reply {
  id: string;
  content: string;
  timestamp: any;
  postId: string;
  attachments?: string[];
  nickname: string;
  authorId: string;
  profilePic?: string;
}

type SortAlgorithm = 'smart' | 'latest' | 'most-liked' | 'most-replied';

interface AlgorithmInfo {
  name: string;
  icon: any;
  description: string;
}

const Community = () => {
  const { t } = useLanguage();
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyUploading, setReplyUploading] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState<Record<string, boolean>>({});
  const [postReplies, setPostReplies] = useState<Record<string, Reply[]>>({});
  const [replyListeners, setReplyListeners] = useState<Record<string, () => void>>({});
  const [currentAlgorithm, setCurrentAlgorithm] = useState<SortAlgorithm>('smart');
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [deleteConfirmReplyId, setDeleteConfirmReplyId] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasSeenChat, setHasSeenChat] = useState(() => localStorage.getItem('chat_last_seen') !== null);
  const [activeTab, setActiveTab] = useState('posts');
  const presenceDocId = React.useRef<string | null>(null);
  const { toast } = useToast();

  // Presence tracking - mark user as online when viewing community
  useEffect(() => {
    const markOnline = async () => {
      try {
        const sessionId = `${user?.uid || 'anon'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        presenceDocId.current = sessionId;
        
        await setDoc(doc(db, 'chat_presence', sessionId), {
          identifier: user?.uid || 'anonymous',
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
    const q = query(collection(db, 'chat_presence'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      
      let count = 0;
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (timestamp > twoMinutesAgo) {
          count++;
        }
      });
      
      setOnlineCount(count);
    }, (error) => {
      console.error('Error listening to presence:', error);
    });

    return () => unsubscribe();
  }, []);

  // Track unread chat messages
  useEffect(() => {
    const lastSeenKey = 'chat_last_seen';
    const lastSeen = localStorage.getItem(lastSeenKey);
    const lastSeenTime = lastSeen ? new Date(parseInt(lastSeen)) : new Date(0);
    
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - 48);
    
    const q = query(
      collection(db, 'chat_messages'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let count = 0;
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const msgTime = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        if (msgTime > lastSeenTime && msgTime > expiryTime) {
          count++;
        }
      });
      setUnreadCount(count);
    });
    
    return () => unsubscribe();
  }, [activeTab]);

  // Mark messages as seen when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      localStorage.setItem('chat_last_seen', Date.now().toString());
      setUnreadCount(0);
      setHasSeenChat(true);
    }
  }, [activeTab]);

  const POSTS_PER_PAGE = 10;

  const algorithms: Record<SortAlgorithm, AlgorithmInfo> = {
    smart: { name: t('smartFeed'), icon: Shuffle, description: t('smartFeedDescription') },
    latest: { name: t('latest'), icon: Clock, description: t('latestDescription') },
    'most-liked': { name: t('popular'), icon: TrendingUp, description: t('popularDescription') },
    'most-replied': { name: t('discussed'), icon: MessageSquare, description: t('discussedDescription') }
  };

  // Load initial posts with real-time updates
  const loadInitialPosts = useCallback(() => {
    try {
      setLoading(true);
      let q;
      
      switch (currentAlgorithm) {
        case 'latest':
          q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
          break;
        case 'most-liked':
          q = query(collection(db, 'posts'), orderBy('likes', 'desc'), orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
          break;
        case 'most-replied':
          q = query(collection(db, 'posts'), orderBy('replies', 'desc'), orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
          break;
        case 'smart':
        default:
          q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(POSTS_PER_PAGE));
          break;
      }
      
      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const posts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as any;
          if (data) {
            posts.push({ 
              id: doc.id, 
              content: data.content || '',
              timestamp: data.timestamp,
              likes: data.likes || 0,
              replies: data.replies || 0,
              attachments: data.attachments || [],
              nickname: data.nickname || '',
              authorId: data.authorId || ''
            } as Post);
          }
        });
        
        setDisplayedPosts(posts);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
        setLoading(false);
      }, (error) => {
        console.error('Error loading initial posts:', error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading initial posts:', error);
      setLoading(false);
      return () => {};
    }
  }, [currentAlgorithm]);

  // Load more posts
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    
    setLoadingMore(true);
    try {
      let q;
      
      switch (currentAlgorithm) {
        case 'latest':
          q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(POSTS_PER_PAGE));
          break;
        case 'most-liked':
          q = query(collection(db, 'posts'), orderBy('likes', 'desc'), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(POSTS_PER_PAGE));
          break;
        case 'most-replied':
          q = query(collection(db, 'posts'), orderBy('replies', 'desc'), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(POSTS_PER_PAGE));
          break;
        case 'smart':
        default:
          q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), startAfter(lastDoc), limit(POSTS_PER_PAGE));
          break;
      }
      
      const querySnapshot = await getDocs(q);
      const newPosts: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as any;
        if (data) {
          newPosts.push({ 
            id: doc.id, 
            content: data.content || '',
            timestamp: data.timestamp,
            likes: data.likes || 0,
            replies: data.replies || 0,
            attachments: data.attachments || [],
            nickname: data.nickname || '',
            authorId: data.authorId || ''
          } as Post);
        }
      });
      
      if (newPosts.length > 0) {
        setDisplayedPosts(prev => [...prev, ...newPosts]);
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastDoc, currentAlgorithm]);

  // Reset and load posts when algorithm changes
  useEffect(() => {
    setDisplayedPosts([]);
    setLastDoc(null);
    setHasMore(true);
    const unsubscribe = loadInitialPosts();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentAlgorithm, loadInitialPosts]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1000 >=
        document.documentElement.offsetHeight
      ) {
        loadMorePosts();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMorePosts]);

  // Real-time updates for displayed posts
  useEffect(() => {
    if (displayedPosts.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    displayedPosts.forEach(post => {
      const postRef = doc(db, 'posts', post.id);
      const unsubscribe = onSnapshot(postRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setDisplayedPosts(prev => 
            prev.map(p => 
              p.id === post.id 
                ? { ...p, likes: data.likes || 0, replies: data.replies || 0 }
                : p
            )
          );
        }
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [displayedPosts.map(p => p.id).join(',')]);

  // Load initial posts on mount
  useEffect(() => {
    const unsubscribe = loadInitialPosts();
    
    return () => {
      // Clean up real-time listener
      if (unsubscribe) unsubscribe();
      // Clean up all reply listeners
      Object.values(replyListeners).forEach(unsub => unsub());
    };
  }, [loadInitialPosts]);

  // Cleanup reply listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(replyListeners).forEach(unsubscribe => unsubscribe());
    };
  }, [replyListeners]);

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    try {
      console.log('Starting file upload for files:', files.map(f => f.name));
      
      const uploadPromises = files.map(async (file, index) => {
        try {
          console.log(`Uploading file ${index + 1}: ${file.name}`);
          
          // Create a unique filename with timestamp
          const timestamp = Date.now();
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${timestamp}_${sanitizedName}`;
          
          // Create storage reference
          const storageRef = ref(storage, `community/${fileName}`);
          console.log(`Storage ref created for: community/${fileName}`);
          
          // Upload file
          const uploadResult = await uploadBytes(storageRef, file);
          console.log(`File uploaded successfully:`, uploadResult);
          
          // Get download URL
          const downloadURL = await getDownloadURL(storageRef);
          console.log(`Download URL obtained:`, downloadURL);
          
          return downloadURL;
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          throw new Error(`Failed to upload ${file.name}: ${error.message}`);
        }
      });
      
      const results = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', results);
      return results;
    } catch (error) {
      console.error('Error in uploadFiles function:', error);
      throw error;
    }
  };

  const handleSubmitPost = async () => {
    if (!user || !userProfile) {
      navigate('/login');
      return;
    }

    if (!newPost.trim()) return;
    
    setUploading(true);
    try {
      let attachments: string[] = [];
      
      if (selectedFiles.length > 0) {
        attachments = await uploadFiles(selectedFiles);
      }
      
      const postData = {
        content: newPost,
        timestamp: serverTimestamp(),
        likes: 0,
        replies: 0,
        attachments: attachments,
        nickname: userProfile.username,
        authorId: user.uid,
        profilePic: userProfile.profilePic || ''
      };
      
      await addDoc(collection(db, 'posts'), postData);
      
      setNewPost('');
      setSelectedFiles([]);
      setIsCreatePostOpen(false);
      
      toast({
        title: t("postShared") || "Post Shared",
        description: t("postSharedDescription") || "Your post has been shared with the community.",
      });
    } catch (error) {
      console.error('Error adding post:', error);
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      toast({
        title: t("filesSkipped"),
        description: t("filesSkippedDescription"),
        variant: "destructive"
      });
    }
    
    setSelectedFiles(validFiles);
  };

  const handleReplyFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      toast({
        title: t("filesSkipped"),
        description: t("filesSkippedDescription"),
        variant: "destructive"
      });
    }
    
    setReplyFiles(validFiles);
  };

  // Handle pull-to-refresh gesture (only at top of scroll)
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollContainer = e.currentTarget.closest('[data-scroll-container]') || window;
    const scrollTop = scrollContainer === window ? window.scrollY : (scrollContainer as HTMLElement).scrollTop;
    
    // Only start tracking if we're at the very top
    if (scrollTop === 0) {
      setTouchStartY(e.touches[0].clientY);
    } else {
      setTouchStartY(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchEndY - touchStartY; // Positive when swiping down
    
    // Only trigger if significant downward swipe from top
    if (diffY > 80) {
      cycleAlgorithm();
    }
    
    setTouchStartY(null);
  };

  const cycleAlgorithm = () => {
    const algorithmList: SortAlgorithm[] = ['smart', 'latest', 'most-liked', 'most-replied'];
    const currentIndex = algorithmList.indexOf(currentAlgorithm);
    const nextIndex = (currentIndex + 1) % algorithmList.length;
    setCurrentAlgorithm(algorithmList[nextIndex]);
    
    const algorithmInfo = algorithms[algorithmList[nextIndex]];
    toast({
      title: `${t('switchedTo')} ${algorithmInfo.name}`,
      description: algorithmInfo.description,
      duration: 2000,
    });
  };

  const handleLikePost = async (postId: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReportPost = async () => {
    if (!user || !reportingPostId || !reportReason) {
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
      const post = displayedPosts.find(p => p.id === reportingPostId);
      
      const reportData = {
        postId: reportingPostId,
        reporterId: user.uid,
        reason: reportReason,
        timestamp: serverTimestamp(),
        status: 'pending',
        postContent: post?.content || '',
        postAuthorId: post?.authorId || ''
      };
      
      await addDoc(collection(db, 'reports'), reportData);
      
      toast({
        title: t("reportSubmitted"),
        description: t("reportSubmittedDescription"),
      });
      
      setReportDialogOpen(false);
      setReportingPostId(null);
      setReportReason('');
    } catch (error) {
      console.error('Error reporting post:', error);
      toast({
        title: t("error"),
        description: t("reportError"),
        variant: "destructive"
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleReplySubmit = async (postId: string) => {
    if (!user || !userProfile) {
      navigate('/login');
      return;
    }

    if (!replyContent.trim()) return;
    
    setReplyUploading(true);
    try {
      let attachments: string[] = [];
      
      if (replyFiles.length > 0) {
        attachments = await uploadFiles(replyFiles);
      }
      
      const replyData = {
        content: replyContent,
        timestamp: serverTimestamp(),
        postId: postId,
        attachments: attachments,
        nickname: userProfile.username,
        authorId: user.uid,
        profilePic: userProfile.profilePic || ''
      };
      
      await addDoc(collection(db, 'replies'), replyData);
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        replies: increment(1)
      });
      
      setReplyContent('');
      setReplyFiles([]);
      setReplyingTo(null);
      
      toast({
        title: t("replyAdded") || "Reply Added",
        description: t("replyAddedDescription") || "Your reply has been added to the conversation.",
      });
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: "Error",
        description: "Failed to add reply. Please try again.",
        variant: "destructive"
      });
    } finally {
      setReplyUploading(false);
    }
  };

  const loadReplies = (postId: string) => {
    // Don't set up listener if one already exists
    if (replyListeners[postId]) return;

    try {
      const q = query(
        collection(db, 'replies'),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const replies: Reply[] = [];
        querySnapshot.forEach((doc) => {
          const replyData = { id: doc.id, ...doc.data() } as Reply;
          if (replyData.postId === postId) {
            replies.push(replyData);
          }
        });
        
        setPostReplies(prev => ({ ...prev, [postId]: replies }));
      });
      
      // Store the unsubscribe function
      setReplyListeners(prev => ({ ...prev, [postId]: unsubscribe }));
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  const toggleReplies = (postId: string) => {
    const isVisible = repliesVisible[postId];
    if (!isVisible && !postReplies[postId]) {
      loadReplies(postId);
    }
    setRepliesVisible(prev => ({ ...prev, [postId]: !isVisible }));
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      
      toast({
        title: t("postDeleted"),
      });
      
      setDeleteConfirmPostId(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: t("deleteFailed"),
        variant: "destructive"
      });
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!editingPostContent.trim()) return;
    
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: editingPostContent
      });
      
      toast({
        title: t("postUpdated"),
      });
      
      setEditingPostId(null);
      setEditingPostContent('');
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: t("updateFailed"),
        variant: "destructive"
      });
    }
  };

  const handleDeleteReply = async (replyId: string, postId: string) => {
    try {
      await deleteDoc(doc(db, 'replies', replyId));
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        replies: increment(-1)
      });
      
      toast({
        title: t("replyDeleted"),
      });
      
      setDeleteConfirmReplyId(null);
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast({
        title: t("deleteFailed"),
        variant: "destructive"
      });
    }
  };

  const handleEditReply = async (replyId: string) => {
    if (!editingReplyContent.trim()) return;
    
    try {
      const replyRef = doc(db, 'replies', replyId);
      await updateDoc(replyRef, {
        content: editingReplyContent
      });
      
      toast({
        title: t("replyUpdated"),
      });
      
      setEditingReplyId(null);
      setEditingReplyContent('');
    } catch (error) {
      console.error('Error updating reply:', error);
      toast({
        title: t("updateFailed"),
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return t("justNow");
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}${t("minutesAgo")}`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}${t("hoursAgo")}`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}${t("daysAgo")}`;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* User Profile & Logout */}
      {user && userProfile && (
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userProfile.profilePic ? (
                <img 
                  src={userProfile.profilePic} 
                  alt={userProfile.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-semibold">
                    {userProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium text-sm">{userProfile.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={logout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </Button>
          </div>
          {/* Online Users Counter */}
          <div className="flex items-center gap-1.5 justify-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-700">
              {onlineCount} {t("online") || "online"}
            </span>
          </div>
        </div>
      )}

      {/* Login prompt with online counter for non-logged users */}
      {!user && (
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg space-y-2">
          <div className="flex items-center justify-center">
            <Button onClick={() => navigate('/login')} className="bg-pink-600 hover:bg-pink-700">
              {t("loginToParticipate") || "Login to participate"}
            </Button>
          </div>
        </div>
      )}

      {/* Report Dialog */}
      <AlertDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reportPostTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reportPostDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <RadioGroup value={reportReason} onValueChange={setReportReason}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="spam" id="spam" />
              <Label htmlFor="spam" className="cursor-pointer">{t("reportReasonSpam")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="harassment" id="harassment" />
              <Label htmlFor="harassment" className="cursor-pointer">{t("reportReasonHarassment")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="inappropriate" id="inappropriate" />
              <Label htmlFor="inappropriate" className="cursor-pointer">{t("reportReasonInappropriate")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hate" id="hate" />
              <Label htmlFor="hate" className="cursor-pointer">{t("reportReasonHateSpeech")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="cursor-pointer">{t("reportReasonOther")}</Label>
            </div>
          </RadioGroup>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reportSubmitting}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReportPost}
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

      {/* Floating Action Button */}
      <Dialog open={isCreatePostOpen} onOpenChange={(open) => {
        if (open && !user) {
          navigate('/login');
        } else {
          setIsCreatePostOpen(open);
        }
      }}>
        <DialogTrigger asChild>
          <Button 
            className="fixed bottom-28 right-6 h-14 w-14 rounded-full shadow-lg bg-pink-600 hover:bg-pink-700 opacity-40 hover:opacity-60 transition-opacity z-[100]"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-pink-800">{t("shareWithCommunity")}</DialogTitle>
            <DialogDescription>
              {t("communityDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-3">
              <Textarea
                placeholder={t("communityPlaceholder")}
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">{t("photo")}</span>
                  </div>
                </Label>
              </div>
              
              <Button 
                onClick={handleSubmitPost}
                disabled={!newPost.trim() || uploading}
                className="bg-pink-600 hover:bg-pink-700 ml-auto"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {uploading ? t("sharing") || "Sharing..." : t("share")}
              </Button>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <Badge key={index} variant="secondary">
                    {file.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs for Posts and Live Chat */}
      <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t("posts") || "Posts"}
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessagesSquare className="h-4 w-4" />
            {t("liveChat") || "Live Chat"}
            {!hasSeenChat && unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                {t("new") || "New"} ({unreadCount})
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <LiveChat onOnlineCountChange={setOnlineCount} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="mt-0">
          {/* Posts Feed */}
          <div 
            className="space-y-4" 
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-pink-800">{t("communityQuestions")}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="hidden text-purple-600 border-purple-200">
                  {React.createElement(algorithms[currentAlgorithm].icon, { className: "w-3 h-3 mr-1" })}
                  {algorithms[currentAlgorithm].name}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {t('swipeDownToChange')}
                </Badge>
              </div>
            </div>
        
        {loading ? (
          // Facebook-style loading skeleton
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-32 w-full rounded-lg" />
                    <div className="flex items-center gap-4 pt-2">
                      <Skeleton className="h-8 w-16" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayedPosts.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <p className="text-gray-500 mb-2">{t('noPostsAvailable')}</p>
              <p className="text-sm text-gray-400">{t('beFirstToShare')}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {displayedPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                 <div className="space-y-3">
                   <div className="flex items-center gap-2 mb-2">
                     {post.profilePic ? (
                       <img 
                         src={post.profilePic} 
                         alt={post.nickname}
                         className="w-8 h-8 rounded-full object-cover"
                       />
                     ) : (
                       <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                         <span className="text-xs font-semibold text-purple-700">
                           {post.nickname?.charAt(0).toUpperCase()}
                         </span>
                       </div>
                     )}
                     <div className="flex-1">
                       <span className="text-sm font-medium text-purple-700">
                         {post.nickname || t("anonymous")}
                       </span>
                     </div>
                     <span className="text-xs text-gray-500">
                       {formatTimeAgo(post.timestamp)}
                     </span>
                     {user && user.uid === post.authorId && editingPostId !== post.id && (
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="bg-background">
                           <DropdownMenuItem 
                             onClick={() => {
                               setEditingPostId(post.id);
                               setEditingPostContent(post.content);
                             }}
                             className="cursor-pointer"
                           >
                             <Edit className="w-4 h-4 mr-2" />
                             {t("edit")}
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                             onClick={() => setDeleteConfirmPostId(post.id)}
                             className="cursor-pointer text-red-600 focus:text-red-600"
                           >
                             <Trash2 className="w-4 h-4 mr-2" />
                             {t("delete")}
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                     )}
                   </div>
                   
                   {editingPostId === post.id ? (
                     <div className="space-y-2">
                       <Textarea
                         value={editingPostContent}
                         onChange={(e) => setEditingPostContent(e.target.value)}
                         className="min-h-[80px]"
                       />
                       <div className="flex gap-2">
                         <Button 
                           size="sm"
                           onClick={() => handleEditPost(post.id)}
                           className="bg-green-600 hover:bg-green-700"
                         >
                           {t("save")}
                         </Button>
                         <Button 
                           size="sm"
                           variant="outline"
                           onClick={() => {
                             setEditingPostId(null);
                             setEditingPostContent('');
                           }}
                         >
                           {t("cancel")}
                         </Button>
                       </div>
                     </div>
                   ) : (
                     <p className="text-gray-700">{post.content}</p>
                   )}
                  
                  {/* Display attachments */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {post.attachments.map((url, index) => (
                        <div key={index} className="relative">
                          {url.includes('video') ? (
                            <video 
                              src={url} 
                              controls 
                              className="max-w-xs rounded-lg"
                            />
                          ) : (
                            <img 
                              src={url} 
                              alt={`Attachment ${index + 1}`}
                              className="max-w-xs rounded-lg"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-pink-600 hover:text-pink-700"
                      onClick={() => handleLikePost(post.id)}
                    >
                      <Heart className="w-4 h-4 mr-1" />
                      {post.likes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-600 hover:text-purple-700"
                      onClick={() => toggleReplies(post.id)}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {post.replies} {t("replies")}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        if (!user) {
                          navigate('/login');
                        } else {
                          setReplyingTo(post.id);
                        }
                      }}
                    >
                      {t("reply") || "Reply"}
                    </Button>
                    {user && user.uid !== post.authorId && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          setReportingPostId(post.id);
                          setReportDialogOpen(true);
                        }}
                      >
                        <Flag className="w-4 h-4 mr-1" />
                        {t("reportPost")}
                      </Button>
                    )}
                   </div>
                  
                   {/* Reply Form */}
                   {replyingTo === post.id && (
                     <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-3 mb-3">
                         <Textarea
                           placeholder={t("writeReply") || "Write your reply..."}
                           value={replyContent}
                           onChange={(e) => setReplyContent(e.target.value)}
                         />
                       </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            id={`reply-file-upload-${post.id}`}
                            multiple
                            accept="image/*,video/*"
                            onChange={handleReplyFileSelect}
                            className="hidden"
                          />
                          <Label htmlFor={`reply-file-upload-${post.id}`} className="cursor-pointer">
                            <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-100">
                              <Camera className="w-4 h-4" />
                              <span className="text-sm">{t("photo")}</span>
                            </div>
                          </Label>
                        </div>
                      </div>
                      
                      {replyFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {replyFiles.map((file, index) => (
                            <Badge key={index} variant="secondary">
                              {file.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                         <Button 
                           size="sm" 
                           onClick={() => handleReplySubmit(post.id)}
                           disabled={!replyContent.trim() || replyUploading}
                           className="bg-purple-600 hover:bg-purple-700"
                         >
                          {replyUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          {replyUploading ? t("submitting") || "Submitting..." : t("submitReply") || "Submit Reply"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                           onClick={() => {
                             setReplyingTo(null);
                             setReplyContent('');
                             setReplyFiles([]);
                           }}
                          disabled={replyUploading}
                        >
                          {t("cancel") || "Cancel"}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies List */}
                  {repliesVisible[post.id] && postReplies[post.id] && (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-medium text-purple-800">{t("replies") || "Replies"}</h4>
                       {postReplies[post.id].map((reply) => (
                          <div key={reply.id} className="bg-purple-50 p-3 rounded-lg ml-4">
                             <div className="flex items-center gap-2 mb-2">
                               <div className="flex-1 flex items-center gap-2">
                                 <span className="text-xs font-medium text-purple-700">
                                   {reply.nickname || t("anonymous")}
                                 </span>
                                 <span className="text-xs text-gray-500">
                                   {formatTimeAgo(reply.timestamp)}
                                 </span>
                               </div>
                               {user && user.uid === reply.authorId && editingReplyId !== reply.id && (
                                 <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                       <MoreVertical className="h-3 w-3" />
                                     </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end" className="bg-background">
                                     <DropdownMenuItem 
                                       onClick={() => {
                                         setEditingReplyId(reply.id);
                                         setEditingReplyContent(reply.content);
                                       }}
                                       className="cursor-pointer"
                                     >
                                       <Edit className="w-3 h-3 mr-2" />
                                       {t("edit")}
                                     </DropdownMenuItem>
                                     <DropdownMenuItem 
                                       onClick={() => setDeleteConfirmReplyId(reply.id)}
                                       className="cursor-pointer text-red-600 focus:text-red-600"
                                     >
                                       <Trash2 className="w-3 h-3 mr-2" />
                                       {t("delete")}
                                     </DropdownMenuItem>
                                   </DropdownMenuContent>
                                 </DropdownMenu>
                               )}
                            </div>
                            {editingReplyId === reply.id ? (
                              <div className="space-y-2 mt-2">
                                <Textarea
                                  value={editingReplyContent}
                                  onChange={(e) => setEditingReplyContent(e.target.value)}
                                  className="min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleEditReply(reply.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {t("save")}
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingReplyId(null);
                                      setEditingReplyContent('');
                                    }}
                                  >
                                    {t("cancel")}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-700 text-sm">{reply.content}</p>
                            )}
                          
                          {/* Display reply attachments */}
                          {reply.attachments && reply.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {reply.attachments.map((url, index) => (
                                <div key={index} className="relative">
                                  {url.includes('video') ? (
                                    <video 
                                      src={url} 
                                      controls 
                                      className="max-w-xs rounded-lg"
                                    />
                                  ) : (
                                    <img 
                                      src={url} 
                                      alt={`Reply attachment ${index + 1}`}
                                      className="max-w-xs rounded-lg"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            ))}
            
            {/* Load More Button / Loading */}
            {hasMore && (
              <div className="text-center py-4">
                {loadingMore ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-gray-500">{t('loadingMorePosts')}</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={loadMorePosts}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    {t('loadMorePosts')}
                  </Button>
                )}
              </div>
            )}
            
            {!hasMore && displayedPosts.length > 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">{t('noMorePosts')}</p>
              </div>
            )}
          </>
        )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Firebase Setup Notice - Show only if no config */}
      {(!db || displayedPosts.length === 0) && !loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Firebase Configuration</CardTitle>
            <CardDescription className="text-blue-700">
              Replace the placeholder config in src/lib/firebase.ts with your actual Firebase project configuration to enable community features.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      {/* Delete Post Confirmation Dialog */}
      <AlertDialog open={deleteConfirmPostId !== null} onOpenChange={(open) => !open && setDeleteConfirmPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePost")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePostConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmPostId && handleDeletePost(deleteConfirmPostId)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Reply Confirmation Dialog */}
      <AlertDialog open={deleteConfirmReplyId !== null} onOpenChange={(open) => !open && setDeleteConfirmReplyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteReply")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteReplyConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteConfirmReplyId) {
                  const reply = Object.values(postReplies).flat().find(r => r.id === deleteConfirmReplyId);
                  if (reply) {
                    handleDeleteReply(deleteConfirmReplyId, reply.postId);
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Community;
