import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Heart, MessageCircle, Camera, Video, Send, Loader2, ArrowLeft, MoreVertical, Edit, Trash2, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
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
  getDoc,
  getDocs,
  deleteDoc,
  where,
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

const PostDetail = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [replyUploading, setReplyUploading] = useState(false);
  
  // Pagination state
  const REPLIES_PER_PAGE = 5;
  const [lastReplyDoc, setLastReplyDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreReplies, setHasMoreReplies] = useState(true);
  const [loadingMoreReplies, setLoadingMoreReplies] = useState(false);
  
  const [editingPostContent, setEditingPostContent] = useState('');
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null);

  // Load initial replies with pagination
  const loadInitialReplies = async () => {
    if (!postId) return;
    
    try {
      const repliesQuery = query(
        collection(db, 'replies'),
        where('postId', '==', postId),
        orderBy('timestamp', 'asc'),
        limit(REPLIES_PER_PAGE)
      );
      
      const snapshot = await getDocs(repliesQuery);
      const repliesData: Reply[] = [];
      
      snapshot.forEach((doc) => {
        repliesData.push({ id: doc.id, ...doc.data() } as Reply);
      });
      
      setReplies(repliesData);
      
      if (snapshot.docs.length > 0) {
        setLastReplyDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      
      setHasMoreReplies(snapshot.docs.length === REPLIES_PER_PAGE);
    } catch (error) {
      console.error('Error loading replies:', error);
    }
  };

  // Load more replies
  const loadMoreReplies = async () => {
    if (!postId || !lastReplyDoc || loadingMoreReplies) return;
    
    setLoadingMoreReplies(true);
    try {
      const repliesQuery = query(
        collection(db, 'replies'),
        where('postId', '==', postId),
        orderBy('timestamp', 'asc'),
        startAfter(lastReplyDoc),
        limit(REPLIES_PER_PAGE)
      );
      
      const snapshot = await getDocs(repliesQuery);
      const newReplies: Reply[] = [];
      
      snapshot.forEach((doc) => {
        newReplies.push({ id: doc.id, ...doc.data() } as Reply);
      });
      
      setReplies(prev => [...prev, ...newReplies]);
      
      if (snapshot.docs.length > 0) {
        setLastReplyDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
      
      setHasMoreReplies(snapshot.docs.length === REPLIES_PER_PAGE);
    } catch (error) {
      console.error('Error loading more replies:', error);
    } finally {
      setLoadingMoreReplies(false);
    }
  };

  // Fetch post data
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() } as Post);
        } else {
          toast({
            title: t("postNotFound") || "Post not found",
            variant: "destructive"
          });
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        toast({
          title: t("error") || "Error",
          description: t("failedToLoadPost") || "Failed to load post",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    loadInitialReplies();

    // Set up real-time listener for post updates only (not replies - for cost savings)
    const unsubscribePost = onSnapshot(doc(db, 'posts', postId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setPost({ id: docSnapshot.id, ...docSnapshot.data() } as Post);
      }
    });

    return () => {
      unsubscribePost();
    };
  }, [postId, navigate, t, toast]);

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      const storageRef = ref(storage, `community/${fileName}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    return Promise.all(uploadPromises);
  };

  const handleReplySubmit = async () => {
    if (!user || !userProfile) {
      navigate('/login');
      return;
    }

    if (!replyContent.trim() || !postId) return;
    
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
      
      const docRef = await addDoc(collection(db, 'replies'), replyData);
      
      // Add new reply to local state to avoid extra Firebase read
      const newReply: Reply = {
        id: docRef.id,
        content: replyContent,
        timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 },
        postId: postId,
        attachments: attachments,
        nickname: userProfile.username,
        authorId: user.uid,
        profilePic: userProfile.profilePic || ''
      };
      setReplies(prev => [...prev, newReply]);
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        replies: increment(1)
      });
      
      // Create notifications
      await createNotificationsForReply(postId, replyContent);
      
      setReplyContent('');
      setReplyFiles([]);
      
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

  const createNotificationsForReply = async (postId: string, replyContent: string) => {
    if (!user || !userProfile || !post) return;
    
    try {
      const postAuthorId = post.authorId;
      const postPreview = post.content?.substring(0, 50) || '';
      const replyPreview = replyContent.substring(0, 50);
      
      const usersToNotify = new Set<string>();
      
      // Notify post author (if not the replier)
      if (postAuthorId && postAuthorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          type: 'reply_to_post',
          postId: postId,
          postPreview: postPreview,
          fromUserId: user.uid,
          fromUsername: userProfile.username,
          fromProfilePic: userProfile.profilePic || '',
          toUserId: postAuthorId,
          read: false,
          timestamp: serverTimestamp(),
          replyPreview: replyPreview
        });
        usersToNotify.add(postAuthorId);
      }
      
      // Find all users who have replied to this post (participants)
      const repliesQuery = query(
        collection(db, 'replies'),
        where('postId', '==', postId)
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      
      const participantIds = new Set<string>();
      repliesSnapshot.forEach((doc) => {
        const replyData = doc.data();
        if (replyData.authorId && 
            replyData.authorId !== user.uid && 
            replyData.authorId !== postAuthorId &&
            !usersToNotify.has(replyData.authorId)) {
          participantIds.add(replyData.authorId);
        }
      });
      
      // Create notifications for participants
      for (const participantId of participantIds) {
        await addDoc(collection(db, 'notifications'), {
          type: 'reply_to_participated',
          postId: postId,
          postPreview: postPreview,
          fromUserId: user.uid,
          fromUsername: userProfile.username,
          fromProfilePic: userProfile.profilePic || '',
          toUserId: participantId,
          read: false,
          timestamp: serverTimestamp(),
          replyPreview: replyPreview
        });
      }
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  };

  const handleLikePost = async () => {
    if (!postId) return;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleEditPost = async () => {
    if (!editingPostContent.trim() || !postId) return;
    
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        content: editingPostContent
      });
      
      toast({ title: t("postUpdated") || "Post updated" });
      setIsEditingPost(false);
      setEditingPostContent('');
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: t("updateFailed") || "Update failed",
        variant: "destructive"
      });
    }
  };

  const handleDeletePost = async () => {
    if (!postId) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      toast({ title: t("postDeleted") || "Post deleted" });
      navigate('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: t("deleteFailed") || "Delete failed",
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
      
      toast({ title: t("replyUpdated") || "Reply updated" });
      setEditingReplyId(null);
      setEditingReplyContent('');
    } catch (error) {
      console.error('Error updating reply:', error);
      toast({
        title: t("updateFailed") || "Update failed",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!postId) return;
    try {
      await deleteDoc(doc(db, 'replies', replyId));
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        replies: increment(-1)
      });
      
      toast({ title: t("replyDeleted") || "Reply deleted" });
      setDeleteReplyId(null);
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast({
        title: t("deleteFailed") || "Delete failed",
        variant: "destructive"
      });
    }
  };

  const handleReplyFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 10 * 1024 * 1024;
      return isValidType && isValidSize;
    });
    setReplyFiles(validFiles);
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return t("justNow") || "Just now";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}${t("minutesAgo") || "m"}`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}${t("hoursAgo") || "h"}`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}${t("daysAgo") || "d"}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-10 w-24 mb-4" />
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">{t("postNotFound") || "Post not found"}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              {t("goBack") || "Go Back"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b z-10 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/?tab=community')}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">{t("post") || "Post"}</h1>
          </div>
        </div>

        {/* Post Content */}
        <div className="border-b">
          <div className="p-4">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-3">
              {post.profilePic ? (
                <img 
                  src={post.profilePic} 
                  alt={post.nickname}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-purple-700">
                    {post.nickname?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <span className="font-medium text-purple-700">
                  {post.nickname || t("anonymous")}
                </span>
                <p className="text-sm text-gray-500">
                  {formatTimeAgo(post.timestamp)}
                </p>
              </div>
              {user && user.uid === post.authorId && !isEditingPost && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background">
                    <DropdownMenuItem 
                      onClick={() => {
                        setIsEditingPost(true);
                        setEditingPostContent(post.content);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Post Content */}
            {isEditingPost ? (
              <div className="space-y-2 mb-4">
                <Textarea
                  value={editingPostContent}
                  onChange={(e) => setEditingPostContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={handleEditPost}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {t("save")}
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditingPost(false);
                      setEditingPostContent('');
                    }}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-lg mb-4 whitespace-pre-wrap">{post.content}</p>
            )}
            
            {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {post.attachments.map((attachment, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    {attachment.includes('.mp4') || attachment.includes('video') ? (
                      <video 
                        src={attachment} 
                        controls 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={attachment} 
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 py-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 text-gray-600"
                onClick={handleLikePost}
              >
                <Heart className="w-5 h-5" />
                <span>{post.likes}</span>
              </Button>
              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span>{post.replies}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reply Input */}
        {user && userProfile && (
          <div className="p-4 border-b bg-white">
            <div className="flex gap-3">
              {userProfile.profilePic ? (
                <img 
                  src={userProfile.profilePic} 
                  alt={userProfile.username}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-purple-700">
                    {userProfile.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder={t("writeReply") || "Write a reply..."}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] resize-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleReplyFileSelect}
                        className="hidden"
                      />
                      <div className="p-2 rounded-full hover:bg-gray-100">
                        <Camera className="w-5 h-5 text-gray-500" />
                      </div>
                    </label>
                    {replyFiles.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {replyFiles.length} {t("files") || "files"}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleReplySubmit}
                    disabled={!replyContent.trim() || replyUploading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {replyUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Login prompt for non-logged users */}
        {!user && (
          <div className="p-4 border-b bg-gray-50">
            <Button onClick={() => navigate('/login')} className="w-full bg-pink-600 hover:bg-pink-700">
              {t("loginToReply") || "Login to reply"}
            </Button>
          </div>
        )}

        {/* Replies */}
        <div className="divide-y">
          {replies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t("noRepliesYet") || "No replies yet. Be the first to reply!"}
            </div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className="p-4">
                <div className="flex gap-3">
                  {reply.profilePic ? (
                    <img 
                      src={reply.profilePic} 
                      alt={reply.nickname}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-purple-700">
                        {reply.nickname?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-purple-700 text-sm">
                        {reply.nickname || t("anonymous")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(reply.timestamp)}
                      </span>
                      {user && user.uid === reply.authorId && editingReplyId !== reply.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto">
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
                              <Edit className="w-4 h-4 mr-2" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteReplyId(reply.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    {editingReplyId === reply.id ? (
                      <div className="space-y-2">
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
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{reply.content}</p>
                    )}
                    
                    {/* Reply Attachments */}
                    {reply.attachments && reply.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {reply.attachments.map((attachment, index) => (
                          <div key={index} className="relative w-20 h-20 rounded overflow-hidden">
                            {attachment.includes('.mp4') || attachment.includes('video') ? (
                              <video 
                                src={attachment} 
                                controls 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img 
                                src={attachment} 
                                alt={`Attachment ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Load More Button */}
          {hasMoreReplies && replies.length > 0 && (
            <div className="p-4 text-center">
              <Button
                variant="outline"
                onClick={loadMoreReplies}
                disabled={loadingMoreReplies}
                className="w-full"
              >
                {loadingMoreReplies ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("loading") || "Loading..."}
                  </>
                ) : (
                  t("loadMoreReplies") || "Load More Replies"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Post Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deletePostTitle") || "Delete Post?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deletePostDescription") || "This action cannot be undone. This will permanently delete your post and all its replies."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Reply Confirmation */}
      <AlertDialog open={!!deleteReplyId} onOpenChange={() => setDeleteReplyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteReplyTitle") || "Delete Reply?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteReplyDescription") || "This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteReplyId && handleDeleteReply(deleteReplyId)}
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

export default PostDetail;
