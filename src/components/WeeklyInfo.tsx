
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Baby } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useState } from "react";
import ultrasoundWeek8 from "@/assets/ultrasound-week-8.jpg";
import ultrasoundWeek12 from "@/assets/ultrasound-week-12.jpg";
import ultrasoundWeek20 from "@/assets/ultrasound-week-20.jpg";
import { loadBabySizeImage, getFallbackFruitEmoji } from "@/utils/imageLoader";

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

  // Load baby size image when selectedWeek changes
  useEffect(() => {
    const loadImage = async () => {
      if (selectedWeek > 0) {
        const image = await loadBabySizeImage(selectedWeek);
        setBabySizeImage(image);
      }
    };
    
    loadImage();
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

  // Get ultrasound image for the week
  const getUltrasoundImage = (week: number) => {
    if (week >= 8 && week < 12) return ultrasoundWeek8;
    if (week >= 12 && week < 20) return ultrasoundWeek12;
    if (week >= 20) return ultrasoundWeek20;
    return null;
  };

  // Get week data - use exact week if available, otherwise create generic data
  const getWeekData = (week: number): WeekData | null => {
    // Try to get exact week data first
    if (weeklyData[week.toString()]) {
      return weeklyData[week.toString()];
    }
    
    // If no exact data, find closest week for base information
    const availableWeeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
    if (availableWeeks.length === 0) return null;
    
    const closestWeek = availableWeeks.reduce((prev, curr) => 
      Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
    );
    
    const baseData = weeklyData[closestWeek.toString()];
    
    // Create week-specific data based on trimester and stage
    const getWeekSpecificData = (weekNumber: number) => {
      if (weekNumber <= 12) {
        // First trimester
        return {
          developments: [
            `Major organ development continues in week ${weekNumber}`,
            "Neural tube and brain development progressing",
            "Heart begins to beat more regularly",
            "Limb buds are forming and growing"
          ],
          momTips: [
            "Take prenatal vitamins daily",
            "Stay hydrated and eat small frequent meals",
            "Get plenty of rest and avoid stress",
            "Schedule regular prenatal checkups"
          ]
        };
      } else if (weekNumber <= 28) {
        // Second trimester
        return {
          developments: [
            `Baby is growing rapidly in week ${weekNumber}`,
            "Muscles and bones are strengthening",
            "Baby can hear sounds from outside",
            "Movement becomes more coordinated",
            "Facial features are becoming clearer"
          ],
          momTips: [
            "Enjoy increased energy levels",
            "Start preparing the nursery",
            "Consider prenatal yoga or gentle exercise",
            "Begin thinking about baby names",
            "Track baby's movements"
          ]
        };
      } else {
        // Third trimester
        return {
          developments: [
            `Baby is preparing for birth in week ${weekNumber}`,
            "Lungs are maturing for breathing",
            "Brain development continues rapidly",
            "Baby is gaining weight steadily",
            "Getting into head-down position"
          ],
          momTips: [
            "Pack your hospital bag",
            "Practice breathing techniques",
            "Get plenty of rest when possible",
            "Stay active with gentle walks",
            "Prepare for labor and delivery"
          ]
        };
      }
    };
    
    const weekSpecificData = getWeekSpecificData(week);
    
    // Create generic data for the selected week
    return {
      ...baseData,
      title: `${t('week')} ${week}`,
      description: `${t('pregnancyProgressWeek')} ${week}.`,
      developments: weekSpecificData.developments,
      momTips: weekSpecificData.momTips
    };
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
      <div className="sticky top-16 z-20 bg-gradient-to-b from-pink-50 to-purple-50 py-2 -mx-4 px-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousWeek}
          disabled={selectedWeek <= 1}
          className="h-10 w-10 bg-white rounded-full shadow hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5 text-pink-600" />
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
          <ChevronRight className="h-5 w-5 text-pink-600" />
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
                className="w-24 h-24 rounded-lg object-cover border-2 border-pink-200 animate-fade-in"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center border-2 border-pink-200">
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
            {getUltrasoundImage(selectedWeek) && (
              <div className="mb-4">
                <img 
                  src={getUltrasoundImage(selectedWeek) || ''}
                  alt={`Ultrasound at week ${selectedWeek}`}
                  className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-200 mb-3"
                />
                <p className="text-xs text-gray-500 text-center">Ultrasound image for week {selectedWeek}</p>
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
