const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'dpzuivtv1',
  api_key: '692887676687652',
  api_secret: 'WfIjcEOfhON17Ai0CBmpndPJqe8',
  secure: true
});

(async function() {
  try {
    // 2. Upload an image from Cloudinary's demo domains
    console.log("Uploading sample image...");
    const uploadResult = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg');
    
    console.log("\nUpload Success!");
    console.log("Secure URL: " + uploadResult.secure_url);
    console.log("Public ID: " + uploadResult.public_id);

    // 3. Get image details: width, height, format, and file size in bytes
    console.log("\nImage Details:");
    console.log("Width: " + uploadResult.width + "px");
    console.log("Height: " + uploadResult.height + "px");
    console.log("Format: " + uploadResult.format);
    console.log("File Size: " + uploadResult.bytes + " bytes");

    // 4. Transform the image
    // Generating a transformed version of the image URL:
    // - fetch_format: 'auto' (f_auto) automatically delivers the image in the most optimal format (e.g., WebP or AVIF) supported by the requesting browser.
    // - quality: 'auto' (q_auto) dynamically adjusts the compression level to balance visual quality and file size.
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      secure: true,
      fetch_format: 'auto',
      quality: 'auto'
    });

    console.log("\nDone! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("Error during execution:", error);
  }
})();
