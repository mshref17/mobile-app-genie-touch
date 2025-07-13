import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lamp } from "lucide-react";
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
        const fileName = language === 'ar' ? 'daily-tips-ar.json' : 'daily-tips-en.json';
        const response = await import(`@/data/${fileName}`);
        const tipsData: TipsData = response.default;
        
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
    <Card className="mb-6 overflow-hidden bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 border-0 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/20 via-orange-100/20 to-pink-100/20"></div>
      <CardHeader className="relative pb-3">
        <CardTitle className="text-pink-800 flex items-center gap-3 text-lg">
          <div className="p-2 bg-yellow-100 rounded-full shadow-md">
            <Lamp className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-sm font-medium text-pink-600 uppercase tracking-wide">
              {t('dailyTip')}
            </div>
            <div className="text-xs text-pink-500 font-normal">
              {t('day')} {currentDay}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
          <p className="text-gray-700 leading-relaxed text-base font-medium">{dailyTip}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyTip;