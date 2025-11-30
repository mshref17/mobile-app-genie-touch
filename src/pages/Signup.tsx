import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: t('profilePicSize'),
          variant: 'destructive'
        });
        return;
      }
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !username) {
      toast({
        title: t('error'),
        description: t('fillRequiredFields'),
        variant: 'destructive'
      });
      return;
    }

    if (username.length < 3) {
      toast({
        title: t('error'),
        description: t('usernameMinLength'),
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('error'),
        description: t('passwordMinLength'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, username, profilePic || undefined);
      toast({
        title: t('success'),
        description: t('accountCreated')
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('accountCreationFailed'),
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/10 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {t('signupTitle')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('signupDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t('usernameRequired')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailRequired')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordRequired')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePic">{t('profilePicture')}</Label>
              <div className="flex items-center gap-4">
                {previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt={t('preview')}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <label htmlFor="profilePic" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">{t('uploadImage')}</span>
                  </div>
                  <Input
                    id="profilePic"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('signupTitle')}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-primary hover:underline">
              {t('login')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
