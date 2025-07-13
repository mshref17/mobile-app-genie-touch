import { Settings, Bell, User, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProfileMenuProps {
  onSettingsOpen: () => void;
  onNotificationSettingsOpen?: () => void;
  currentWeek: number;
}

export function ProfileMenu({ onSettingsOpen, onNotificationSettingsOpen, currentWeek }: ProfileMenuProps) {
  const { t } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-10">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-pink-100 text-pink-600">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:block">Week {currentWeek}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Pregnancy Journey</p>
          <p className="text-xs text-muted-foreground">Week {currentWeek}</p>
        </div>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={onSettingsOpen}>
          <Settings className="mr-2 h-4 w-4" />
          {t('settings')}
        </DropdownMenuItem>
        
        {onNotificationSettingsOpen && (
          <DropdownMenuItem onClick={onNotificationSettingsOpen}>
            <Bell className="mr-2 h-4 w-4" />
            {t('notificationSettings')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}