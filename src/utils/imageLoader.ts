// Dynamic image loader for baby size images
// Place your images in src/assets/baby-sizes/ folder with format: week1.jpg, week2.jpg, etc.

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

// Preload and cache images for better performance
const imageCache: Record<number, string | null> = {};

export const loadBabySizeImage = async (week: number): Promise<string | null> => {
  // Return cached image if available
  if (imageCache[week] !== undefined) {
    return imageCache[week];
  }
  
  // Load and cache the image
  const image = await getBabySizeImage(week);
  imageCache[week] = image;
  
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