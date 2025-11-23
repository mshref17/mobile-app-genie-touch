import { Home, Baby, Users, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  trackingMode?: 'pregnant' | 'period' | null;
  onSettingsClick?: () => void;
}

export function BottomNavigation({ activeTab, onTabChange, trackingMode, onSettingsClick }: BottomNavigationProps) {
  const { t } = useLanguage();

  const tabs = [
    { id: 'dashboard', label: t('dashboard'), icon: Home },
    ...(trackingMode === 'pregnant' ? [{ id: 'weekly', label: t('weeklyInfo'), icon: Baby }] : []),
    { id: 'community', label: t('community'), icon: Users },
    { id: 'settings', label: t('settings'), icon: Settings, isAction: true },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => tab.isAction && onSettingsClick ? onSettingsClick() : onTabChange(tab.id)}
              className={`relative flex flex-row items-center gap-1.5 px-3 py-2 h-auto ${
                activeTab === tab.id && !tab.isAction ? 'text-pink-600' : 'text-gray-500'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}