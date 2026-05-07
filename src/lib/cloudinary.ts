import { v2 as cloudinary } from 'cloudinary';

// Configuration
// We parse the URL since it's defined as CLOUDINARY_URL in .env
cloudinary.config({
  secure: true,
});

export const cloudinaryService = {
  /**
   * Uploads a base64 image or a file buffer to Cloudinary
   * @param fileBase64 The file encoded as a base64 string
   * @param productId The ID of the product to group images in its folder
   * @returns The secure URL and public ID of the uploaded image
   */
  async uploadImage(fileBase64: string, productId: string) {
    try {
      const result = await cloudinary.uploader.upload(fileBase64, {
        folder: `products/${productId}`,
        resource_type: 'image',
        transformation: [
          // 'pad' con 'background: auto' detecta el color predominante de los bordes de la foto y rellena los huecos con ese mismo color.
          { width: 800, height: 800, crop: 'pad', background: 'auto' }
        ]
      });
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error('Could not upload image to Cloudinary');
    }
  },

  /**
   * Deletes an image from Cloudinary using its public ID
   * @param publicId The public ID of the image to delete
   */
  async deleteImage(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting from Cloudinary:', error);
      throw new Error('Could not delete image from Cloudinary');
    }
  },
};
