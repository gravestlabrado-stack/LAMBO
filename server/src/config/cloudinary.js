const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload buffer directly to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Folder in Cloudinary
 * @returns {Promise<{url: string, public_id: string}>}
 */
const uploadBufferToCloudinary = (buffer, folder = 'lambo_trees') => {
  return new Promise((resolve, reject) => {
    // If Cloudinary is not configured in development, provide placeholder or warning
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.warn('[Cloudinary] Missing credentials. Returning placeholder data URI.');
      const base64 = buffer.toString('base64');
      return resolve({
        url: `data:image/jpeg;base64,${base64}`,
        public_id: `local_dev_${Date.now()}`,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadBufferToCloudinary,
};
