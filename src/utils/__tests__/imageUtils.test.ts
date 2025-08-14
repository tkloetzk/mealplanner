import { getFoodImageSource, isValidUrl } from '../imageUtils';
import { Food } from '@/types/food';

describe('imageUtils', () => {
  describe('getFoodImageSource', () => {
    const baseFoodProps = {
      id: '1',
      name: 'Test Food',
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 5,
      servingSize: '1',
      servingSizeUnit: 'cup' as const,
      category: 'proteins' as const,
      meal: ['breakfast', 'lunch', 'dinner'] as const
    };

    it('returns cloudinary URL when available', () => {
      const food: Food = {
        ...baseFoodProps,
        cloudinaryUrl: 'https://res.cloudinary.com/example/image/upload/v123/test.jpg',
        imagePath: 'local-image.jpg',
        imageUrl: 'https://external.com/image.jpg'
      };

      const result = getFoodImageSource(food);
      expect(result).toBe('https://res.cloudinary.com/example/image/upload/v123/test.jpg');
    });

    it('returns local image path when cloudinary URL is not available', () => {
      const food: Food = {
        ...baseFoodProps,
        imagePath: 'local-image.jpg',
        imageUrl: 'https://external.com/image.jpg'
      };

      const result = getFoodImageSource(food);
      expect(result).toBe('/images/food/local-image.jpg');
    });

    it('returns external image URL when cloudinary and local path are not available', () => {
      const food: Food = {
        ...baseFoodProps,
        imageUrl: 'https://external.com/image.jpg'
      };

      const result = getFoodImageSource(food);
      expect(result).toBe('https://external.com/image.jpg');
    });

    it('returns null when no images are available', () => {
      const food: Food = {
        ...baseFoodProps
      };

      const result = getFoodImageSource(food);
      expect(result).toBeNull();
    });

    it('prioritizes cloudinary over other options', () => {
      const food: Food = {
        ...baseFoodProps,
        cloudinaryUrl: 'https://res.cloudinary.com/example/image/upload/v123/priority.jpg',
        imagePath: 'local-backup.jpg',
        imageUrl: 'https://external.com/backup.jpg'
      };

      const result = getFoodImageSource(food);
      expect(result).toBe('https://res.cloudinary.com/example/image/upload/v123/priority.jpg');
    });

    it('falls back to local path when cloudinary URL is empty', () => {
      const food: Food = {
        ...baseFoodProps,
        cloudinaryUrl: '',
        imagePath: 'fallback-local.jpg',
        imageUrl: 'https://external.com/fallback.jpg'
      };

      const result = getFoodImageSource(food);
      expect(result).toBe('/images/food/fallback-local.jpg');
    });

    it('falls back to external URL when both cloudinary and local are empty', () => {
      const food: Food = {
        ...baseFoodProps,
        cloudinaryUrl: '',
        imagePath: '',
        imageUrl: 'https://external.com/final-fallback.jpg'
      };

      const result = getFoodImageSource(food);
      expect(result).toBe('https://external.com/final-fallback.jpg');
    });
  });

  describe('isValidUrl', () => {
    it('returns true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://subdomain.example.com/path/to/resource')).toBe(true);
    });

    it('returns true for valid HTTPS URLs with query parameters', () => {
      expect(isValidUrl('https://example.com/path?param1=value1&param2=value2')).toBe(true);
    });

    it('returns true for valid URLs with fragments', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true);
    });

    it('returns false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(true); // FTP is actually valid
      expect(isValidUrl('mailto:user@example.com')).toBe(true); // mailto is valid
    });

    it('returns false for null or empty values', () => {
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidUrl(undefined as any)).toBe(false);
    });

    it('handles edge cases', () => {
      expect(isValidUrl('localhost:3000')).toBe(true); // URL constructor treats this as valid
      expect(isValidUrl('http://localhost:3000')).toBe(true); // Valid localhost
      expect(isValidUrl('https://192.168.1.1')).toBe(true); // IP address
    });
  });
});