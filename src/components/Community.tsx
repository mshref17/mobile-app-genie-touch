
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Camera, Video, Send, Loader2, TrendingUp, Clock, MessageSquare, Shuffle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
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
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LocalNotifications } from '@capacitor/local-notifications';

interface Post {
  id: string;
  content: string;
  timestamp: any;
  likes: number;
  replies: number;
  category: string;
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
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
  const { toast } = useToast();

  const POSTS_PER_PAGE = 5;

  // Trigger notification for post author when someone replies
  const triggerReplyNotification = async (postAuthorId: string, replierNickname: string) => {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'New Reply',
            body: `${replierNickname} replied to your post`,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {
              postAuthorId,
              replierNickname
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const algorithms: Record<SortAlgorithm, AlgorithmInfo> = {
    smart: { name: 'Smart Feed', icon: Shuffle, description: 'Mixed algorithm' },
    latest: { name: 'Latest', icon: Clock, description: 'Newest posts first' },
    'most-liked': { name: 'Popular', icon: TrendingUp, description: 'Most liked posts' },
    'most-replied': { name: 'Discussed', icon: MessageSquare, description: 'Most replies' }
  };

  // Sort all posts based on current algorithm
  const sortedPosts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (currentAlgorithm) {
      case 'latest':
        // Show today's latest posts first, then older posts
        const todaysLatest = allPosts.filter(post => {
          if (!post.timestamp) return false;
          const postDate = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
          postDate.setHours(0, 0, 0, 0);
          return postDate.getTime() >= today.getTime();
        });
        const olderPosts = allPosts.filter(post => {
          if (!post.timestamp) return false;
          const postDate = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
          postDate.setHours(0, 0, 0, 0);
          return postDate.getTime() < today.getTime();
        });
        return [...todaysLatest, ...olderPosts].sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return timeB - timeA;
        });
      
      case 'most-liked':
        // Show today's most liked first, then all posts by likes
        const todaysMostLiked = allPosts.filter(post => {
          if (!post.timestamp) return false;
          const postDate = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
          postDate.setHours(0, 0, 0, 0);
          return postDate.getTime() >= today.getTime();
        }).sort((a, b) => (b.likes || 0) - (a.likes || 0));
        const otherPosts = allPosts.filter(post => {
          if (!post.timestamp) return false;
          const postDate = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
          postDate.setHours(0, 0, 0, 0);
          return postDate.getTime() < today.getTime();
        }).sort((a, b) => (b.likes || 0) - (a.likes || 0));
        return [...todaysMostLiked, ...otherPosts];
      
      case 'most-replied':
        // Show today's most replied first, then all posts by replies
        const todaysMostReplied = allPosts.filter(post => {
          if (!post.timestamp) return false;
          const postDate = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
          postDate.setHours(0, 0, 0, 0);
          return postDate.getTime() >= today.getTime();
        }).sort((a, b) => (b.replies || 0) - (a.replies || 0));
        const otherReplied = allPosts.filter(post => {
          if (!post.timestamp) return false;
          const postDate = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
          postDate.setHours(0, 0, 0, 0);
          return postDate.getTime() < today.getTime();
        }).sort((a, b) => (b.replies || 0) - (a.replies || 0));
        return [...todaysMostReplied, ...otherReplied];
      
      case 'smart':
      default:
        // Random mix of all posts with weighted scoring
        return [...allPosts].sort(() => Math.random() - 0.5).sort((a, b) => {
          const now = Date.now();
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          
          // Calculate recency score (higher for newer posts)
          const recencyA = Math.max(0, 1 - (now - timeA) / (7 * 24 * 60 * 60 * 1000)); // 7 days decay
          const recencyB = Math.max(0, 1 - (now - timeB) / (7 * 24 * 60 * 60 * 1000));
          
          // Calculate engagement score
          const engagementA = (a.likes || 0) * 0.5 + (a.replies || 0) * 1;
          const engagementB = (b.likes || 0) * 0.5 + (b.replies || 0) * 1;
          
          // Combined score with randomness
          const scoreA = (engagementA * 0.4 + recencyA * 0.3) + Math.random() * 0.3;
          const scoreB = (engagementB * 0.4 + recencyB * 0.3) + Math.random() * 0.3;
          
          return scoreB - scoreA;
        });
    }
  }, [allPosts, currentAlgorithm]);

  // Load posts in batches for lazy loading
  const loadMorePosts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const startIndex = currentPage * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const nextBatch = sortedPosts.slice(startIndex, endIndex);
    
    if (nextBatch.length === 0) {
      setHasMore(false);
    } else {
      setDisplayedPosts(prev => [...prev, ...nextBatch]);
      setCurrentPage(prev => prev + 1);
    }
    
    setLoadingMore(false);
  }, [currentPage, sortedPosts, loadingMore, hasMore]);

  // Reset pagination when algorithm changes
  useEffect(() => {
    setCurrentPage(0);
    setDisplayedPosts([]);
    setHasMore(true);
    // Load first batch
    const firstBatch = sortedPosts.slice(0, POSTS_PER_PAGE);
    setDisplayedPosts(firstBatch);
    setCurrentPage(1);
    setHasMore(sortedPosts.length > POSTS_PER_PAGE);
  }, [currentAlgorithm, sortedPosts]);

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

  // Load posts from Firebase
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setAllPosts(postsData);
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Clean up all reply listeners
      Object.values(replyListeners).forEach(unsubscribe => unsubscribe());
    };
  }, []);

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
        category: t("general") || "General",
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

  // Handle swipe to change algorithm
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY - touchEndY;
    
    // If swipe down (negative diff) and significant distance
    if (diffY < -50) {
      cycleAlgorithm();
    }
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
      
      // Trigger notification for post author
      const postAuthor = allPosts.find(p => p.id === postId)?.authorId;
      if (postAuthor) {
        triggerReplyNotification(postAuthor, replyNickname || 'Someone');
      }
      
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
    <div className="space-y-6">
      {/* Create Post */}
      <Card>
        <CardHeader>
          <CardTitle className="text-pink-800">{t("shareWithCommunity")}</CardTitle>
          <CardDescription>
            {t("communityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

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
      {(!db || allPosts.length === 0) && (
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
