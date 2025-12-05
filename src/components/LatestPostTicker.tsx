import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle } from 'lucide-react';

interface LatestPostTickerProps {
  onNavigateToCommunity: () => void;
}

const LatestPostTicker = ({ onNavigateToCommunity }: LatestPostTickerProps) => {
  const { t, language } = useLanguage();
  const [latestPost, setLatestPost] = useState<{ content: string; authorName: string } | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const MAX_CHARS = 60;

  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        const content = data.content || '';
        const truncated = content.length > MAX_CHARS 
          ? content.substring(0, MAX_CHARS) + '...' 
          : content;
        
        setLatestPost({
          content: truncated,
          authorName: data.authorName || (language === 'ar' ? 'مجهول' : 'Anonymous')
        });
      }
    });

    return () => unsubscribe();
  }, [language]);

  // Typewriter animation
  useEffect(() => {
    if (!latestPost) return;

    const fullText = `${latestPost.authorName}: ${latestPost.content}`;
    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 40);

    return () => clearInterval(typingInterval);
  }, [latestPost]);

  if (!latestPost) return null;

  return (
    <button
      onClick={onNavigateToCommunity}
      className="w-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-200/50 dark:border-purple-700/50 rounded-xl p-3 flex items-center gap-3 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 group"
    >
      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
        <MessageCircle className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 text-start overflow-hidden">
        <p className="text-xs text-muted-foreground mb-0.5">
          {language === 'ar' ? 'آخر منشور' : 'Latest Post'}
        </p>
        <p className="text-sm font-medium text-foreground truncate">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-0.5 h-4 bg-purple-500 ml-0.5 animate-pulse" />
          )}
        </p>
      </div>
      <div className="flex-shrink-0 text-purple-500 group-hover:translate-x-1 transition-transform">
        {language === 'ar' ? '←' : '→'}
      </div>
    </button>
  );
};

export default LatestPostTicker;
