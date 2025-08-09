import { Home, Baby, Users, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsOpen: () => void;
}

export function BottomNavigation({ activeTab, onTabChange, onSettingsOpen }: BottomNavigationProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    { id: 'weekly', label: t('weeklyInfo'), icon: Baby },
    { id: 'community', label: t('community'), icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 pt-2 pb-8 z-50 safe-area-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-1 p-3 h-auto ${
              activeTab === tab.id ? 'text-pink-600' : 'text-gray-500'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsOpen}
          className="flex flex-col items-center gap-1 p-3 h-auto text-gray-500"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">{t('settings')}</span>
        </Button>
      </div>
    </div>
  );
}