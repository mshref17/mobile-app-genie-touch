
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Camera, Video, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
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
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Post {
  id: string;
  content: string;
  timestamp: any;
  likes: number;
  replies: number;
  category: string;
  attachments?: string[];
}

interface Reply {
  id: string;
  content: string;
  timestamp: any;
  postId: string;
}

const Community = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [repliesVisible, setRepliesVisible] = useState<Record<string, boolean>>({});
  const [postReplies, setPostReplies] = useState<Record<string, Reply[]>>({});
  const [replyListeners, setReplyListeners] = useState<Record<string, () => void>>({});
  const { toast } = useToast();

  // Load posts from Firebase
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      setPosts(postsData);
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
        attachments: attachments
      };
      
      console.log('Adding post to Firestore:', postData);
      
      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log('Post added successfully with ID:', docRef.id);
      
      setNewPost('');
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
    
    try {
      const replyData = {
        content: replyContent,
        timestamp: serverTimestamp(),
        postId: postId
      };
      
      // Add reply to Firestore
      await addDoc(collection(db, 'replies'), replyData);
      
      // Update post reply count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        replies: increment(1)
      });
      
      setReplyContent('');
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
          <Textarea
            placeholder={t("communityPlaceholder")}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          
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
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-pink-800">{t("communityQuestions")}</h3>
        
        {posts.map((post) => (
          <Card key={post.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-pink-600 border-pink-200">
                    {post.category}
                  </Badge>
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
                    <Textarea
                      placeholder={t("writeReply") || "Write your reply..."}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleReplySubmit(post.id)}
                        disabled={!replyContent.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {t("submitReply") || "Submit Reply"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setReplyingTo(null)}
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
                        <p className="text-gray-700 text-sm">{reply.content}</p>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {formatTimeAgo(reply.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Firebase Setup Notice - Show only if no config */}
      {(!db || posts.length === 0) && (
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
