// Dynamic ultrasound image loader
// Place ultrasound images in src/assets/ultrasound/ folder with format: eight.jpg, twelve.jpg, twenty.jpg, etc.

const weekNumberToWord = (week: number): string => {
  const words: Record<number, string> = {
    1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
    6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten',
    11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen',
    16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen', 20: 'twenty',
    21: 'twentyone', 22: 'twentytwo', 23: 'twentythree', 24: 'twentyfour', 25: 'twentyfive',
    26: 'twentysix', 27: 'twentyseven', 28: 'twentyeight', 29: 'twentynine', 30: 'thirty',
    31: 'thirtyone', 32: 'thirtytwo', 33: 'thirtythree', 34: 'thirtyfour', 35: 'thirtyfive',
    36: 'thirtysix', 37: 'thirtyseven', 38: 'thirtyeight', 39: 'thirtynine', 40: 'forty'
  };
  return words[week] || '';
};

const getUltrasoundImage = async (week: number): Promise<string | null> => {
  try {
    const weekWord = weekNumberToWord(week);
    if (!weekWord) return null;
    
    // Try different common image extensions
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (const ext of extensions) {
      try {
        const image = await import(`@/assets/ultrasound/${weekWord}.${ext}`);
        return image.default;
      } catch (error) {
        // Continue to next extension
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.log(`No ultrasound image found for week ${week}`);
    return null;
  }
};

// Preload and cache images for better performance
const imageCache: Record<number, string | null> = {};

export const loadUltrasoundImage = async (week: number): Promise<string | null> => {
  // Return cached image if available
  if (imageCache[week] !== undefined) {
    return imageCache[week];
  }
  
  // Load and cache the image
  const image = await getUltrasoundImage(week);
  imageCache[week] = image;
  
  return image;
};

export default loadUltrasoundImage;
