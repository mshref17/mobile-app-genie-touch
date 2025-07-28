
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
  serverTimestamp 
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

const Community = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

    return () => unsubscribe();
  }, []);

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `community/${fileName}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });
    
    return Promise.all(uploadPromises);
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
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                  <Video className="w-4 h-4" />
                  <span className="text-sm">{t("video")}</span>
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
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.replies} {t("replies")}
                  </Button>
                </div>
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
