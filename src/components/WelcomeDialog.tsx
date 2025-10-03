import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Baby, Calendar } from "lucide-react";

export function WelcomeDialog() {
  const [open, setOpen] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    // Check if user has seen the welcome message
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      // Show after splash screen (2.5 seconds)
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {language === 'ar' ? 'مرحباً بك في دليل المرأة' : 'Welcome to دليل المرأة'}
          </DialogTitle>
          <DialogDescription className="text-center pt-4">
            {language === 'ar' 
              ? 'رفيقك الشامل للصحة النسائية' 
              : 'Your Comprehensive Wellness Companion'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-4 p-4 bg-pink-50 rounded-lg">
            <div className="shrink-0 mt-1">
              <Baby className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                {language === 'ar' ? 'تتبع الحمل' : 'Pregnancy Tracking'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'تابعي رحلة حملك أسبوعاً بأسبوع مع معلومات مفصلة عن تطور طفلك'
                  : 'Follow your pregnancy journey week by week with detailed baby development information'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
            <div className="shrink-0 mt-1">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">
                {language === 'ar' ? 'تتبع الدورة الشهرية' : 'Period Tracking'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'سجلي دورتك الشهرية واحصلي على تنبؤات دقيقة للدورات القادمة'
                  : 'Track your menstrual cycle and get accurate predictions for upcoming periods'}
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full">
          {language === 'ar' ? 'ابدأي الآن' : 'Get Started'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
