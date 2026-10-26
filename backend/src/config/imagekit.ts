import ImageKit from "imagekit";

const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  if (!publicKey || !privateKey || !urlEndpoint) {
    console.error(
      "FATAL: In production, IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT must be provided!"
    );
    process.exit(1);
  }
}

let imagekit: ImageKit | null = null;

if (publicKey && privateKey && urlEndpoint) {
  imagekit = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });
}

export { imagekit };
