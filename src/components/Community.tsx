
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Camera, Video, Send, Loader2, TrendingUp, Clock, MessageSquare, Shuffle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  DocumentData
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
}

interface Reply {
  id: string;
  content: string;
  timestamp: any;
  postId: string;
  attachments?: string[];
  nickname: string;
  authorId: string;
}

type SortAlgorithm = 'smart' | 'latest' | 'most-liked' | 'most-replied';

interface AlgorithmInfo {
  name: string;
  icon: any;
  description: string;
}

const Community = () => {
  const { t } = useLanguage();
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [newPost, setNewPost] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyNickname, setReplyNickname] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyUploading, setReplyUploading] = useState(false);
  const [repliesVisible, setRepliesVisible] = useState<Record<string, boolean>>({});
  const [postReplies, setPostReplies] = useState<Record<string, Reply[]>>({});
  const [replyListeners, setReplyListeners] = useState<Record<string, () => void>>({});
  const [currentAlgorithm, setCurrentAlgorithm] = useState<SortAlgorithm>('smart');
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { toast } = useToast();

  const POSTS_PER_PAGE = 10;

  const algorithms: Record<SortAlgorithm, AlgorithmInfo> = {
    smart: { name: 'Smart Feed', icon: Shuffle, description: 'Mixed algorithm' },
    latest: { name: 'Latest', icon: Clock, description: 'Newest posts first' },
    'most-liked': { name: 'Popular', icon: TrendingUp, description: 'Most liked posts' },
    'most-replied': { name: 'Discussed', icon: MessageSquare, description: 'Most replies' }
  };

  // Load initial posts
  const loadInitialPosts = useCallback(async () => {
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
      
      const querySnapshot = await getDocs(q);
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
    } catch (error) {
      console.error('Error loading initial posts:', error);
      setLoading(false);
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
    loadInitialPosts();
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
    loadInitialPosts();
    
    return () => {
      // Clean up all reply listeners
      Object.values(replyListeners).forEach(unsubscribe => unsubscribe());
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
    if (!newPost.trim()) return;
    
    console.log('Attempting to submit post:', newPost);
    setUploading(true);
    try {
      let attachments: string[] = [];
      
      // Upload files if any
      if (selectedFiles.length > 0) {
        console.log('Uploading files:', selectedFiles);
        attachments = await uploadFiles(selectedFiles);
      }
      
      const postData = {
        content: newPost,
        timestamp: serverTimestamp(),
        likes: 0,
        replies: 0,
        attachments: attachments,
        nickname: nickname,
        authorId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      console.log('Adding post to Firestore:', postData);
      
      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('Post added successfully with ID:', docRef.id);
      
      setNewPost('');
      setNickname('');
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
      title: `Switched to ${algorithmInfo.name}`,
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

  const handleReplySubmit = async (postId: string) => {
    if (!replyContent.trim()) return;
    
    setReplyUploading(true);
    try {
      let attachments: string[] = [];
      
      // Upload files if any
      if (replyFiles.length > 0) {
        console.log('Uploading reply files:', replyFiles);
        attachments = await uploadFiles(replyFiles);
      }
      
      const replyData = {
        content: replyContent,
        timestamp: serverTimestamp(),
        postId: postId,
        attachments: attachments,
        nickname: replyNickname,
        authorId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // Add reply to Firestore
      await addDoc(collection(db, 'replies'), replyData);
      
      // Update post reply count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        replies: increment(1)
      });
      
      setReplyContent('');
      setReplyNickname('');
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

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Floating Action Button */}
      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
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
              <div>
                <Label htmlFor="nickname">{t("nickname") || "Nickname"}</Label>
                <Input
                  id="nickname"
                  placeholder={t("enterNickname") || "Enter your nickname"}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-1"
                />
              </div>
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
                disabled={!newPost.trim() || !nickname.trim() || uploading}
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

      {/* Posts Feed */}
      <div 
        className="space-y-4" 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-pink-800">{t("communityQuestions")}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              {React.createElement(algorithms[currentAlgorithm].icon, { className: "w-3 h-3 mr-1" })}
              {algorithms[currentAlgorithm].name}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Swipe down to change
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
              <p className="text-gray-500 mb-2">No posts available</p>
              <p className="text-sm text-gray-400">Be the first to share something with the community!</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {displayedPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                 <div className="space-y-3">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium text-purple-700">
                       {post.nickname || "Anonymous"}
                     </span>
                     <span className="text-sm text-gray-500">
                       {formatTimeAgo(post.timestamp)}
                     </span>
                   </div>
                  
                  <p className="text-gray-700">{post.content}</p>
                  
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
                      onClick={() => setReplyingTo(post.id)}
                    >
                      {t("reply") || "Reply"}
                    </Button>
                  </div>
                  
                   {/* Reply Form */}
                   {replyingTo === post.id && (
                     <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                       <div className="space-y-3 mb-3">
                         <div>
                           <Label htmlFor={`reply-nickname-${post.id}`}>{t("nickname") || "Nickname"}</Label>
                           <Input
                             id={`reply-nickname-${post.id}`}
                             placeholder={t("enterNickname") || "Enter your nickname"}
                             value={replyNickname}
                             onChange={(e) => setReplyNickname(e.target.value)}
                             className="mt-1"
                           />
                         </div>
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
                           disabled={!replyContent.trim() || !replyNickname.trim() || replyUploading}
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
                             setReplyNickname('');
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
                             <span className="text-xs font-medium text-purple-700">
                               {reply.nickname || "Anonymous"}
                             </span>
                             <span className="text-xs text-gray-500">
                               {formatTimeAgo(reply.timestamp)}
                             </span>
                           </div>
                           <p className="text-gray-700 text-sm">{reply.content}</p>
                          
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
                    <span className="text-sm text-gray-500">Loading more posts...</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={loadMorePosts}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    Load More Posts
                  </Button>
                )}
              </div>
            )}
            
            {!hasMore && displayedPosts.length > 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No more posts to load</p>
              </div>
            )}
          </>
        )}
      </div>

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
    </div>
  );
};

export default Community;
