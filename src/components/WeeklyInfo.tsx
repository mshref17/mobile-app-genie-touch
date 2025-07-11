
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WeeklyInfoProps {
  currentWeek: number;
}

const weeklyData = {
  4: {
    title: "Week 4: The Beginning",
    babySize: "Poppy Seed",
    sizeDescription: "About 2mm",
    description: "Your baby is just a cluster of cells, but amazing development is already beginning!",
    developments: [
      "The neural tube is forming",
      "Basic circulation is developing",
      "Hormone production begins"
    ],
    momTips: [
      "Start taking prenatal vitamins",
      "Avoid alcohol and smoking",
      "Schedule your first prenatal appointment"
    ],
    image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop"
  },
  8: {
    title: "Week 8: Rapid Growth",
    babySize: "Raspberry",
    sizeDescription: "About 16mm",
    description: "Your baby is growing rapidly and major organs are developing.",
    developments: [
      "Arms and legs are growing longer",
      "Fingers and toes are forming", 
      "Heart is beating regularly"
    ],
    momTips: [
      "Stay hydrated",
      "Eat small, frequent meals",
      "Get plenty of rest"
    ],
    image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&h=300&fit=crop"
  },
  12: {
    title: "Week 12: End of First Trimester",
    babySize: "Lime",
    sizeDescription: "About 5cm",
    description: "Congratulations! You've reached an important milestone.",
    developments: [
      "All major organs are formed",
      "Baby can move and stretch",
      "Facial features are developing"
    ],
    momTips: [
      "Morning sickness may improve",
      "Consider sharing your news",
      "Continue healthy eating habits"
    ],
    image: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=400&h=300&fit=crop"
  },
  16: {
    title: "Week 16: Second Trimester Begins",
    babySize: "Avocado",
    sizeDescription: "About 11cm",
    description: "Welcome to the second trimester! Many women feel their best during this time.",
    developments: [
      "Baby's skeleton is developing",
      "You might feel first movements",
      "Baby can hear sounds"
    ],
    momTips: [
      "Enjoy increased energy",
      "Start thinking about baby names",
      "Consider prenatal yoga"
    ],
    image: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=400&h=300&fit=crop"
  }
};

const WeeklyInfo = ({ currentWeek }: WeeklyInfoProps) => {
  // Find the closest week data
  const availableWeeks = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
  const closestWeek = availableWeeks.reduce((prev, curr) => 
    Math.abs(curr - currentWeek) < Math.abs(prev - currentWeek) ? curr : prev
  );

  const weekData = weeklyData[closestWeek as keyof typeof weeklyData];

  if (currentWeek === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Information</CardTitle>
          <CardDescription>
            Your weekly pregnancy information will appear here once your pregnancy progresses.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-pink-800">{weekData.title}</CardTitle>
              <CardDescription>You are currently {currentWeek} weeks pregnant</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
              Week {currentWeek}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{weekData.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-pink-800">Baby's Size This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <img 
              src={weekData.image} 
              alt={weekData.babySize}
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div>
              <h3 className="text-xl font-semibold text-pink-600">{weekData.babySize}</h3>
              <p className="text-gray-600">{weekData.sizeDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-pink-800">Baby's Development</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {weekData.developments.map((item, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-800">Tips for Mom</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {weekData.momTips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-600">{tip}</span>
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
