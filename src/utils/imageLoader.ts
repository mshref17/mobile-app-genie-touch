// Dynamic image loader for baby size and ultrasound images
// Place your images in src/assets/baby-sizes/ folder with format: week1.jpg, week2.jpg, etc.
// Place your ultrasound images in src/assets/ultrasounds/ folder with format: baby1.jpg, baby2.jpg, etc.

const getBabySizeImage = async (week: number): Promise<string | null> => {
  try {
    // Try different common image extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of extensions) {
      try {
        const image = await import(`@/assets/baby-sizes/week${week}.${ext}`);
        return image.default;
      } catch (error) {
        // Continue to next extension
        continue;
      }
    }
    
    // If no image found, return null
    return null;
  } catch (error) {
    console.log(`No baby size image found for week ${week}`);
    return null;
  }
};

const getUltrasoundImage = async (week: number): Promise<string | null> => {
  try {
    // Try different common image extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of extensions) {
      try {
        const image = await import(`@/assets/ultrasounds/baby${week}.${ext}`);
        return image.default;
      } catch (error) {
        // Continue to next extension
        continue;
      }
    }
    
    // If no image found, return null
    return null;
  } catch (error) {
    console.log(`No ultrasound image found for week ${week}`);
    return null;
  }
};

// Preload and cache images for better performance
const babySizeImageCache: Record<number, string | null> = {};
const ultrasoundImageCache: Record<number, string | null> = {};

export const loadBabySizeImage = async (week: number): Promise<string | null> => {
  // Return cached image if available
  if (babySizeImageCache[week] !== undefined) {
    return babySizeImageCache[week];
  }
  
  // Load and cache the image
  const image = await getBabySizeImage(week);
  babySizeImageCache[week] = image;
  
  return image;
};

export const loadUltrasoundImage = async (week: number): Promise<string | null> => {
  // Return cached image if available
  if (ultrasoundImageCache[week] !== undefined) {
    return ultrasoundImageCache[week];
  }
  
  // Load and cache the image
  const image = await getUltrasoundImage(week);
  ultrasoundImageCache[week] = image;
  
  return image;
};

// Function to get fallback fruit emoji if no image is available
export const getFallbackFruitEmoji = (week: number): string => {
  const fruits = [
    '🫐', '🍒', '🍓', '🫐', '🍇', '🍈', '🍑', '🥝', 
    '🍊', '🍋', '🥭', '🍌', '🍍', '🥥', '🍎', '🍐',
    '🍅', '🥒', '🥕', '🌶️', '🫒', '🥑', '🍆', '🥔',
    '🌽', '🥬', '🥦', '🧄', '🧅', '🍠', '🥨', '🥖',
    '🍞', '🥯', '🧇', '🥞', '🍳', '🥚', '🧀', '🥓'
  ];
  
  // Use week number to consistently pick a fruit
  return fruits[week % fruits.length];
};

export default loadBabySizeImage;