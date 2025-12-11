import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import appLogo from "@/assets/app-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center z-[100] animate-fade-out">
        <div className="text-center animate-scale-out">
          <div className="w-28 h-28 mx-auto mb-6">
            <img src={appLogo} alt="App Logo" className="w-full h-full rounded-3xl shadow-2xl animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('appName')}</h1>
          <p className="text-gray-600">{t('wellnessCompanion')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-pink-100 to-purple-100 flex items-center justify-center z-[100] animate-fade-in">
      <div className="text-center">
        <div className="w-28 h-28 mx-auto mb-6 animate-bounce-slow">
          <img src={appLogo} alt="App Logo" className="w-full h-full rounded-3xl shadow-2xl" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2 animate-fade-in">{t('appName')}</h1>
        <p className="text-gray-600 animate-fade-in">{t('wellnessCompanion')}</p>
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
