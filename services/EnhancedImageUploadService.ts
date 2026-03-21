import * as ImagePicker from 'expo-image-picker';

export interface ImageUploadService {
  pickImage: (maxSize?: number) => Promise<{ uri: string; base64?: string; name?: string }>;
  validateImage: (file: ImagePicker.ImagePickerAsset) => { isValid: boolean; error?: string };
  compressImage: (uri: string, quality?: number) => Promise<string>;
}

class EnhancedImageUploadService implements ImageUploadService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  async pickImage(maxSize = this.MAX_FILE_SIZE): Promise<{ uri: string; base64?: string; name?: string }> {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        throw new Error('Camera permission denied');
      }

      // Pick image with options
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: false,
      });

      if (result.canceled) {
        throw new Error('Image selection cancelled');
      }

      if (!result.assets || result.assets.length === 0) {
        throw new Error('No image selected');
      }

      const asset = result.assets[0];
      
      // Validate image
      const validation = this.validateImage(asset);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid image format');
      }

      // Check file size if available
      if (asset.fileSize && asset.fileSize > maxSize) {
        throw new Error(`Image too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      }

      // Generate base64 for preview
      let base64: string | undefined;
      if (asset.uri) {
        try {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          base64 = await this.blobToBase64(blob);
        } catch (error) {
          console.warn('Could not generate base64 preview:', error);
        }
      }

      return {
        uri: asset.uri,
        base64,
        name: asset.fileName || 'image',
      };
    } catch (error) {
      console.error('Image picker error:', error);
      throw error;
    }
  }

  validateImage(file: ImagePicker.ImagePickerAsset): { isValid: boolean; error?: string } {
    // Check if image format is supported
    const supportedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const fileExtension = file.uri?.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !supportedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `Unsupported image format: ${fileExtension}. Supported formats: ${supportedTypes.join(', ')}`
      };
    }

    // Check file size
    if (file.fileSize && file.fileSize > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `Image too large. Maximum size is 5MB, selected image is ${(file.fileSize / (1024 * 1024)).toFixed(2)}MB`
      };
    }

    return { isValid: true };
  }

  async compressImage(uri: string, quality = 0.8): Promise<string> {
    try {
      // For now, return original URI
      // In a real implementation, you would use image compression libraries
      return uri;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert image to base64'));
      };
      reader.readAsDataURL(blob);
    });
  }
}

export default EnhancedImageUploadService;
