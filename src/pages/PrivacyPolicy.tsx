import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const content = {
    en: {
      title: "Privacy Policy",
      lastUpdated: "Last Updated: January 2025",
      backButton: "Back to Home",
      sections: [
        {
          title: "Introduction",
          content: "دليل المرأة (\"we\", \"our\", or \"us\") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application."
        },
        {
          title: "Information We Collect",
          content: "We collect information that you provide directly to us, including:\n• Pregnancy and menstrual cycle data\n• Due dates and pregnancy milestones\n• Personal health information you choose to track\n• App preferences and settings\n• Device information for notifications"
        },
        {
          title: "How We Use Your Information",
          content: "We use the information we collect to:\n• Provide personalized pregnancy and cycle tracking\n• Send you relevant health tips and reminders\n• Improve and optimize our app functionality\n• Provide customer support\n• Ensure the security of our services"
        },
        {
          title: "Data Storage and Security",
          content: "Your data is stored locally on your device and in secure cloud storage. We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction."
        },
        {
          title: "Data Sharing",
          content: "We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:\n• With your explicit consent\n• To comply with legal obligations\n• To protect our rights and safety"
        },
        {
          title: "Your Rights",
          content: "You have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Delete your data\n• Export your data\n• Opt-out of notifications\n\nTo exercise these rights, please contact us through the app settings."
        },
        {
          title: "Children's Privacy",
          content: "Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13."
        },
        {
          title: "Changes to This Policy",
          content: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the \"Last Updated\" date."
        },
        {
          title: "Contact Us",
          content: "If you have questions about this Privacy Policy, please contact us through the app's settings or support section."
        }
      ]
    },
    ar: {
      title: "سياسة الخصوصية",
      lastUpdated: "آخر تحديث: يناير 2025",
      backButton: "العودة للرئيسية",
      sections: [
        {
          title: "المقدمة",
          content: "دليل المرأة (\"نحن\" أو \"تطبيقنا\") ملتزمون بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع المعلومات واستخدامها والكشف عنها وحمايتها عند استخدامك لتطبيقنا."
        },
        {
          title: "المعلومات التي نجمعها",
          content: "نجمع المعلومات التي تقدمها لنا مباشرة، بما في ذلك:\n• بيانات الحمل والدورة الشهرية\n• تواريخ الولادة المتوقعة ومعالم الحمل\n• المعلومات الصحية الشخصية التي تختار تتبعها\n• تفضيلات التطبيق والإعدادات\n• معلومات الجهاز للإشعارات"
        },
        {
          title: "كيف نستخدم معلوماتك",
          content: "نستخدم المعلومات التي نجمعها من أجل:\n• توفير تتبع شخصي للحمل والدورة الشهرية\n• إرسال نصائح صحية وتذكيرات ذات صلة\n• تحسين وظائف التطبيق\n• تقديم دعم العملاء\n• ضمان أمان خدماتنا"
        },
        {
          title: "تخزين البيانات والأمان",
          content: "يتم تخزين بياناتك محلياً على جهازك وفي تخزين سحابي آمن. نطبق تدابير أمنية مناسبة لحماية معلوماتك الشخصية من الوصول أو التغيير أو الكشف أو التدمير غير المصرح به."
        },
        {
          title: "مشاركة البيانات",
          content: "نحن لا نبيع أو نتاجر أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك فقط في الحالات التالية:\n• بموافقتك الصريحة\n• للامتثال للالتزامات القانونية\n• لحماية حقوقنا وسلامتنا"
        },
        {
          title: "حقوقك",
          content: "لديك الحق في:\n• الوصول إلى بياناتك الشخصية\n• تصحيح البيانات غير الدقيقة\n• حذف بياناتك\n• تصدير بياناتك\n• إلغاء الاشتراك في الإشعارات\n\nلممارسة هذه الحقوق، يرجى الاتصال بنا من خلال إعدادات التطبيق."
        },
        {
          title: "خصوصية الأطفال",
          content: "تطبيقنا غير مخصص للأطفال دون سن 13 عاماً. نحن لا نجمع عن قصد معلومات شخصية من الأطفال دون سن 13."
        },
        {
          title: "التغييرات على هذه السياسة",
          content: "قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات عن طريق نشر سياسة الخصوصية الجديدة على هذه الصفحة وتحديث تاريخ \"آخر تحديث\"."
        },
        {
          title: "اتصل بنا",
          content: "إذا كان لديك أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا من خلال إعدادات التطبيق أو قسم الدعم."
        }
      ]
    }
  };

  const t = content[language as keyof typeof content];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          {t.backButton}
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            {t.lastUpdated}
          </p>

          <div className="space-y-8">
            {t.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  {section.title}
                </h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {section.content}
                </p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
