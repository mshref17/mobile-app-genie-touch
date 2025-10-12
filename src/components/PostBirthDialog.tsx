import { useLanguage } from "@/contexts/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Baby, Heart } from "lucide-react";

interface PostBirthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToPeriodTracking: () => void;
}

const PostBirthDialog = ({ open, onOpenChange, onSwitchToPeriodTracking }: PostBirthDialogProps) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl text-pink-600 flex items-center justify-center gap-2">
            <Baby className="h-6 w-6" />
            {t('congratulationsTitle')}
            <Heart className="h-6 w-6" />
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {t('congratulationsMessage')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4">
            <h3 className="font-semibold text-pink-800 mb-2 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t('postpartumTracking')}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('postpartumMessage')}
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center italic">
            {t('postpartumInfoNote')}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={onSwitchToPeriodTracking}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {t('switchToPeriodTracking')}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {t('continuePregnancy')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostBirthDialog;
