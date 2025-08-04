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
import { supabase } from "@/lib/supabase";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Post {
  id: string;
  content: string;
  created_at: string;
  likes: number;
  replies: number;
  category: string;
  attachments?: string[];
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
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
  const { toast } = useToast();

  // Load posts from Supabase
  useEffect(() => {
    loadPosts();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('posts_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'posts' },
        () => loadPosts()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    console.log('Starting Firebase file upload for', files.length, 'files');
    const uploadPromises = files.map(async (file) => {
      try {
        console.log('Uploading file to Firebase:', file.name, 'Size:', file.size, 'Type:', file.type);
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `community/${fileName}`;
        
        // Create a reference to Firebase Storage
        const storageRef = ref(storage, filePath);
        
        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);
        console.log('File uploaded to Firebase:', snapshot.ref.fullPath);
        
        // Get the download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Firebase download URL:', downloadURL);
        
        return downloadURL;
      } catch (error) {
        console.error('Error uploading file to Firebase:', file.name, error);
        throw error;
      }
    });
    
    try {
      const urls = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully to Firebase:', urls);
      return urls;
    } catch (error) {
      console.error('Error in Promise.all for Firebase uploads:', error);
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
        likes: 0,
        replies: 0,
        category: t("general") || "General",
        attachments: attachments
      };
      
      console.log('Adding post to Supabase:', postData);
      
      // Add post to Supabase
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();
      
      if (error) throw error;
      console.log('Post added successfully:', data);
      
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
      const { error } = await supabase.rpc('increment_likes', { post_id: postId });
      if (error) throw error;
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReplySubmit = async (postId: string) => {
    if (!replyContent.trim()) return;
    
    try {
      const replyData = {
        content: replyContent,
        post_id: postId
      };
      
      // Add reply to Supabase
      const { error: replyError } = await supabase
        .from('replies')
        .insert([replyData]);
      
      if (replyError) throw replyError;
      
      // Update post reply count
      const { error: updateError } = await supabase.rpc('increment_replies', { post_id: postId });
      if (updateError) throw updateError;
      
      setReplyContent('');
      setReplyingTo(null);
      
      // Reload replies for this post
      loadReplies(postId);
      
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

  const loadReplies = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setPostReplies(prev => ({ ...prev, [postId]: data || [] }));
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

  const formatTimeAgo = (timestamp: string) => {
    if (!timestamp) return 'Just now';
    
    const date = new Date(timestamp);
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
                    {formatTimeAgo(post.created_at)}
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
                          {formatTimeAgo(reply.created_at)}
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
    </div>
  );
};

export default Community;