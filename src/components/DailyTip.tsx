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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-pink-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          {t('dailyTip')} - {t('day')} {currentDay}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 leading-relaxed">{dailyTip}</p>
      </CardContent>
    </Card>
  );
};

export default DailyTip;