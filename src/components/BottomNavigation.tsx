import { Home, Baby, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  trackingMode?: 'pregnant' | 'period' | null;
}

export function BottomNavigation({ activeTab, onTabChange, trackingMode }: BottomNavigationProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    ...(trackingMode === 'pregnant' ? [{ id: 'weekly', label: t('weeklyInfo'), icon: Baby }] : []),
    { id: 'community', label: t('community'), icon: Users },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 z-50 safe-area-top">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isCommunity = tab.id === 'community';
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => !isCommunity && onTabChange(tab.id)}
              disabled={isCommunity}
              className={`relative flex flex-col items-center gap-1 p-3 h-auto ${
                activeTab === tab.id ? 'text-pink-600' : 'text-gray-500'
              } ${isCommunity ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <tab.icon className="h-5 w-5" />
              <span className="text-xs">{tab.label}</span>
              {isCommunity && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-1 -right-1 text-[10px] px-1.5 py-0 h-5 bg-pink-100 text-pink-600 border-pink-200"
                >
                  Soon
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}