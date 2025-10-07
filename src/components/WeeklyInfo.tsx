
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Baby } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import { loadBabySizeImage, getFallbackFruitEmoji } from "@/utils/imageLoader";
import { loadUltrasoundImage } from "@/utils/ultrasoundLoader";

interface WeeklyInfoProps {
  currentWeek: number;
}

interface WeekData {
  title: string;
  babySize: string;
  sizeDescription: string;
  description: string;
  developments: string[];
  momTips: string[];
  image: string;
  ultrasoundImage?: string;
}

const WeeklyInfo = ({ currentWeek }: WeeklyInfoProps) => {
  const { language, t } = useLanguage();
  const [weeklyData, setWeeklyData] = useState<Record<string, WeekData>>({});
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [babySizeImage, setBabySizeImage] = useState<string | null>(null);
  const [ultrasoundImage, setUltrasoundImage] = useState<string | null>(null);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const data = await import(`@/data/weeks-${language}.json`);
        setWeeklyData(data.default);
      } catch (error) {
        console.error('Error loading weekly data:', error);
        // Fallback to English if Arabic data fails to load
        if (language === 'ar') {
          const fallbackData = await import('@/data/weeks-en.json');
          setWeeklyData(fallbackData.default);
        }
      }
    };

    loadWeeklyData();
  }, [language]);

  // Update selected week when current week changes
  useEffect(() => {
    setSelectedWeek(currentWeek);
  }, [currentWeek]);

  // Load baby size and ultrasound images when selectedWeek changes
  useEffect(() => {
    const loadImages = async () => {
      if (selectedWeek > 0) {
        const babyImage = await loadBabySizeImage(selectedWeek);
        setBabySizeImage(babyImage);
        
        const ultrasound = await loadUltrasoundImage(selectedWeek);
        setUltrasoundImage(ultrasound);
      }
    };
    
    loadImages();
  }, [selectedWeek]);

  // Find the closest week data for selected week
  const availableWeeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);

  // Navigation handlers
  const handlePreviousWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (selectedWeek < 40) {
      setSelectedWeek(selectedWeek + 1);
    }
  };


  // Get week data - simply return exact week data or null
  const getWeekData = (week: number): WeekData | null => {
    return weeklyData[week.toString()] || null;
  };

  const weekData = getWeekData(selectedWeek);

  if (currentWeek === 0 || !weekData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('weeklyInformation')}</CardTitle>
          <CardDescription>
            {t('weeklyInfoDescription')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation Header - Compact */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-pink-50 to-purple-50 py-3 -mx-4 px-4 flex items-center justify-between shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousWeek}
          disabled={selectedWeek <= 1}
          className="h-10 w-10 bg-white rounded-full shadow hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5 text-pink-600" />
        </Button>

        <div className="flex flex-col items-center">
          <Badge variant="secondary" className="bg-pink-100 text-pink-800 px-4 py-1 text-lg font-semibold">
            {t('week')} {selectedWeek}
            {selectedWeek === currentWeek && (
              <span className="text-xs ml-1">({t('currentWeek')})</span>
            )}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextWeek}
          disabled={selectedWeek >= 40}
          className="h-10 w-10 bg-white rounded-full shadow hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5 text-pink-600" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-pink-800">{t('babySizeThisWeek')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {babySizeImage ? (
              <img 
                src={babySizeImage} 
                alt={weekData.babySize}
                className="w-24 h-24 rounded-lg object-cover animate-fade-in"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <span className="text-4xl">{getFallbackFruitEmoji(selectedWeek)}</span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-pink-600" dangerouslySetInnerHTML={{ __html: weekData.babySize }}></h3>
              <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: weekData.sizeDescription }}></p>
            </div>
          </div>
          {weekData.description && (
            <div className="mt-4 p-4 bg-pink-50 rounded-lg">
              <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: weekData.description }}></p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-pink-800">{t('babyDevelopment')}</CardTitle>
          </CardHeader>
          <CardContent>
            {ultrasoundImage && (
              <div className="mb-4">
                <img 
                  src={ultrasoundImage}
                  alt={`${t('week')} ${selectedWeek}`}
                  className="w-full max-w-md mx-auto rounded-lg border-2 border-pink-200 mb-3 shadow-md animate-fade-in"
                />
                <p className="text-xs text-gray-500 text-center">{t('week')} {selectedWeek}</p>
              </div>
            )}
            <ul className="space-y-2">
              {weekData.developments.map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0 mr-3"></div>
                  <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: item }}></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-800">{t('tipsForMom')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {weekData.momTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0 mr-3"></div>
                  <span className="text-gray-600" dangerouslySetInnerHTML={{ __html: tip }}></span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WeeklyInfo;
