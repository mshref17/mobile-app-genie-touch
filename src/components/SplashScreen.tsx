import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SplashScreenProps {
  onComplete: () => void;
}

const AnimatedAppIcon = ({ className = "w-24 h-24" }: { className?: string }) => {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="splashBgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#B794F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F687B3', stopOpacity: 1 }} />
        </linearGradient>
        
        <linearGradient id="splashCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.25 }} />
          <stop offset="100%" style={{ stopColor: '#FFFFFF', stopOpacity: 0.1 }} />
        </linearGradient>
      </defs>
      
      <rect width="200" height="200" rx="45" fill="url(#splashBgGradient)"/>
      
      <g transform="translate(100, 100)">
        <g opacity="0.3">
          <circle cx="0" cy="0" r="65" fill="none" stroke="#FFFFFF" strokeWidth="8">
            <animate attributeName="opacity" values="0;0.3" dur="2.5s" fill="freeze"/>
          </circle>
        </g>
        
        <circle cx="0" cy="0" r="65" fill="none" 
                stroke="#FFFFFF" 
                strokeWidth="8" 
                strokeDasharray="150 408" 
                strokeDashoffset="0"
                opacity="0"
                strokeLinecap="round"
                transform="rotate(-90)">
          <animate attributeName="opacity" values="0;0.9" dur="2.5s" fill="freeze"/>
          <animate attributeName="stroke-dasharray" 
                   values="0 408; 150 408" 
                   dur="2.5s" 
                   begin="1s"
                   fill="freeze"/>
        </circle>
        
        <circle cx="0" cy="0" r="50" fill="url(#splashCircleGradient)" opacity="0">
          <animate attributeName="opacity" values="0;0.4" dur="2s" begin="1.5s" fill="freeze"/>
        </circle>
        <circle cx="0" cy="0" r="38" fill="url(#splashCircleGradient)" opacity="0">
          <animate attributeName="opacity" values="0;0.3" dur="2s" begin="1.8s" fill="freeze"/>
        </circle>
        
        <g transform="translate(0, 0)">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="80,-80; 60,-60; 40,-40; 20,-20; 0,0"
            dur="2.5s"
            fill="freeze"/>
          
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="45 0 0; 30 0 0; 15 0 0; 5 0 0; 0 0 0"
            dur="2.5s"
            additive="sum"
            fill="freeze"/>
          
          <animateTransform
            attributeName="transform"
            type="scale"
            values="0.3; 0.5; 0.7; 0.9; 1"
            dur="2.5s"
            additive="sum"
            fill="freeze"/>
          
          <animate attributeName="opacity" values="0;1" dur="1s" fill="freeze"/>
          
          <ellipse cx="-12" cy="-8" rx="11" ry="15" fill="#FFFFFF" opacity="0.9">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.7; 1,1; 1,0.7; 1,1; 1,0.8; 1,1"
              dur="2.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <ellipse cx="-12" cy="-8" rx="8" ry="11" fill="#F687B3" opacity="0.6">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.7; 1,1; 1,0.7; 1,1; 1,0.8; 1,1"
              dur="1.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <circle cx="-15" cy="-10" r="3" fill="#FFFFFF" opacity="0.8"/>
          
          <ellipse cx="-10" cy="8" rx="9" ry="12" fill="#FFFFFF" opacity="0.9">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.6; 1,1; 1,0.6; 1,1; 1,0.8; 1,1"
              dur="1.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <ellipse cx="-10" cy="8" rx="6" ry="9" fill="#B794F6" opacity="0.6">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.6; 1,1; 1,0.6; 1,1; 1,0.8; 1,1"
              dur="1.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <circle cx="-12" cy="6" r="2.5" fill="#FFFFFF" opacity="0.8"/>
          
          <ellipse cx="12" cy="-8" rx="11" ry="15" fill="#FFFFFF" opacity="0.9">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.7; 1,1; 1,0.7; 1,1; 1,0.8; 1,1"
              dur="1.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <ellipse cx="12" cy="-8" rx="8" ry="11" fill="#F687B3" opacity="0.6">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.7; 1,1; 1,0.7; 1,1; 1,0.8; 1,1"
              dur="1.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <circle cx="15" cy="-10" r="3" fill="#FFFFFF" opacity="0.8"/>
          
          <ellipse cx="10" cy="8" rx="9" ry="12" fill="#FFFFFF" opacity="0.9">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.6; 1,1; 1,0.6; 1,1; 1,0.8; 1,1"
              dur="1.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <ellipse cx="10" cy="8" rx="6" ry="9" fill="#B794F6" opacity="0.6">
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1,1; 1,0.6; 1,1; 1,0.6; 1,1; 1,0.8; 1,1"
              dur="1.5s"
              additive="sum"
              fill="freeze"/>
          </ellipse>
          <circle cx="12" cy="6" r="2.5" fill="#FFFFFF" opacity="0.8"/>
          
          <ellipse cx="0" cy="0" rx="3" ry="20" fill="#FFFFFF" opacity="0.95"/>
          <ellipse cx="0" cy="0" rx="2" ry="18" fill="#F687B3" opacity="0.7"/>
          
          <path d="M 0,-18 Q -4,-25 -6,-28" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.9" strokeLinecap="round"/>
          <path d="M 0,-18 Q 4,-25 6,-28" stroke="#FFFFFF" strokeWidth="1.5" fill="none" opacity="0.9" strokeLinecap="round"/>
          <circle cx="-6" cy="-28" r="2" fill="#FFFFFF" opacity="0.9"/>
          <circle cx="6" cy="-28" r="2" fill="#FFFFFF" opacity="0.9"/>
        </g>
        
        <circle cx="0" cy="-65" r="5" fill="#FFFFFF" opacity="0">
          <animate attributeName="opacity" values="0;0.9" dur="0.5s" begin="1.5s" fill="freeze"/>
        </circle>
        <circle cx="46" cy="-46" r="4" fill="#FFFFFF" opacity="0">
          <animate attributeName="opacity" values="0;0.7" dur="0.5s" begin="1.6s" fill="freeze"/>
        </circle>
        <circle cx="65" cy="0" r="4" fill="#FFFFFF" opacity="0">
          <animate attributeName="opacity" values="0;0.7" dur="0.5s" begin="1.7s" fill="freeze"/>
        </circle>
        <circle cx="46" cy="46" r="4" fill="#FFFFFF" opacity="0">
          <animate attributeName="opacity" values="0;0.7" dur="0.5s" begin="1.8s" fill="freeze"/>
        </circle>
      </g>
    </svg>
  );
};

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
            <AnimatedAppIcon className="w-full h-full" />
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
        <div className="w-28 h-28 mx-auto mb-6">
          <AnimatedAppIcon className="w-full h-full" />
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
