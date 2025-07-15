
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Camera, Video, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface Post {
  id: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: number;
  category: string;
}

const Community = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      content: "First time mom here! When did you first feel your baby move? I'm 16 weeks and haven't felt anything yet. Is this normal?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      likes: 5,
      replies: 3,
      category: t("firstTrimester")
    },
    {
      id: '2', 
      content: "What are your favorite pregnancy-safe exercises? Looking for ways to stay active during my second trimester.",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      likes: 8,
      replies: 7,
      category: t("fitness")
    }
  ]);

  const [newPost, setNewPost] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { toast } = useToast();

  const handleSubmitPost = () => {
    if (newPost.trim()) {
      const post: Post = {
        id: Date.now().toString(),
        content: newPost,
        timestamp: new Date(),
        likes: 0,
        replies: 0,
        category: t("general")
      };
      
      setPosts([post, ...posts]);
      setNewPost('');
      setSelectedFiles([]);
      
      toast({
        title: t("postShared"),
        description: t("postSharedDescription"),
      });
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

  const formatTimeAgo = (date: Date) => {
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
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center space-x-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                  <Camera className="w-4 h-4" />
                  <span className="text-sm">{t("photo")}</span>
                </div>
              </Label>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center space-x-2 px-3 py-2 border rounded-md hover:bg-gray-50">
                  <Video className="w-4 h-4" />
                  <span className="text-sm">{t("video")}</span>
                </div>
              </Label>
            </div>
            
            <Button 
              onClick={handleSubmitPost}
              disabled={!newPost.trim()}
              className="ml-auto bg-pink-600 hover:bg-pink-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {t("share")}
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
                
                <div className="flex items-center space-x-4 pt-2">
                  <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700">
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

      {/* Firebase Setup Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">{t("setupRequired")}</CardTitle>
          <CardDescription className="text-yellow-700">
            {t("firebaseSetupNotice")}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Community;
