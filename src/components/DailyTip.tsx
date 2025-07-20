import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

interface DailyTipProps {
  currentDay: number;
}

interface Tip {
  day: number;
  tip: string;
}

interface TipsData {
  tips: Tip[];
}

const DailyTip = ({ currentDay }: DailyTipProps) => {
  const { language, t } = useLanguage();
  const [dailyTip, setDailyTip] = useState<string>('');

  useEffect(() => {
    const loadDailyTips = async () => {
      try {
        let tipsData: TipsData;
        
        if (language === 'ar') {
          const response = await import('@/data/daily-tips-ar.json');
          tipsData = response.default;
        } else {
          const response = await import('@/data/daily-tips-en.json');
          tipsData = response.default;
        }
        
        // Use modulo to cycle through tips if current day exceeds available tips
        const tipIndex = currentDay > 0 ? ((currentDay - 1) % tipsData.tips.length) : 0;
        const tip = tipsData.tips[tipIndex];
        
        setDailyTip(tip?.tip || 'Take care of yourself and your baby today!');
      } catch (error) {
        console.error('Error loading daily tips:', error);
        setDailyTip('Take care of yourself and your baby today!');
      }
    };

    if (currentDay > 0) {
      loadDailyTips();
    }
  }, [currentDay, language]);

  if (currentDay <= 0) {
    return null;
  }

  return (
    <div className="mb-6 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
      <Card className="relative bg-white/95 backdrop-blur-md rounded-2xl border-0 shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
        
        <CardHeader className="pb-6 pt-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center -right-1">
                  <span className="text-white text-xs font-bold">{currentDay}</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {t('dailyTip')}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent"></div>
              </div>
              <p className="text-gray-700 leading-relaxed text-base font-medium italic">
                "{dailyTip}"
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default DailyTip;