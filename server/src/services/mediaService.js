const { uploadBufferToCloudinary } = require('../config/cloudinary');

/**
 * Service for handling media assets and Cloudinary streaming
 */
class MediaService {
  /**
   * Upload an image buffer to Cloudinary
   * @param {Buffer} buffer - Raw file buffer from Multer
   * @param {string} folder - Target folder in Cloudinary
   * @returns {Promise<{url: string, public_id: string}>}
   */
  async uploadImage(buffer, folder = 'lambo_trees') {
    if (!buffer) {
      throw new Error('Image buffer is required for upload');
    }
    return uploadBufferToCloudinary(buffer, folder);
  }
}

module.exports = new MediaService();
