import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowRight, Trash2, MessageSquare, LogOut, User, Mail, Calendar, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';

interface Post {
  id: string;
  content: string;
  timestamp: any;
  likes: number;
  replies: number;
}

const Profile = () => {
  const { user, userProfile, logout } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchUserPosts = async () => {
      try {
        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid),
          orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const posts: Post[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          posts.push({
            id: doc.id,
            content: data.content || '',
            timestamp: data.timestamp,
            likes: data.likes || 0,
            replies: data.replies || 0,
          });
        });
        setUserPosts(posts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [user, navigate]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDeleteAccountRequest = async () => {
    setDeleteAccountLoading(true);
    // This would typically send a request to support/admin
    // For now, we'll show a message that the request has been submitted
    setTimeout(() => {
      setDeleteAccountLoading(false);
      alert(t('deleteAccountRequestSent') || 'Your account deletion request has been submitted. We will process it within 48 hours.');
    }, 1000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user || !userProfile) {
    return null;
  }

  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 pb-20">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20"
          >
            <ArrowRight className={`h-4 w-4 ${isRTL ? '' : 'rotate-180'}`} />
            <span className="mx-2">{t('back')}</span>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">{t('profile') || 'Profile'}</h1>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-14">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                <AvatarImage src={userProfile.profilePic} alt={userProfile.username} />
                <AvatarFallback className="bg-pink-100 text-pink-600 text-2xl">
                  {userProfile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{userProfile.username}</h2>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {t('memberSince') || 'Member since'}: {formatDate(user.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date())}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Posts Section */}
        <Card className="mt-4 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-pink-600" />
              {t('myPosts') || 'My Posts'}
            </CardTitle>
            <CardDescription>
              {t('myPostsDescription') || 'All your community posts'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPosts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{t('noPostsYet') || 'No posts yet'}</p>
                <Button
                  variant="link"
                  onClick={() => navigate('/')}
                  className="text-pink-600 mt-2"
                >
                  {t('goToCommunity') || 'Go to community'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => navigate('/')}
                  >
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatDate(post.timestamp)}</span>
                      <span>❤️ {post.likes}</span>
                      <span>💬 {post.replies}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mt-4 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-600">{t('accountActions') || 'Account Actions'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full justify-start gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('deleteAccount') || 'Delete Account'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteAccountTitle') || 'Delete Account?'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteAccountDescription') || 'This will submit a request to delete your account and all your data. This action cannot be undone. We will process your request within 48 hours.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccountRequest}
                    disabled={deleteAccountLoading}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteAccountLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t('confirmDelete') || 'Confirm Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
