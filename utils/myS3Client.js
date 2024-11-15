const { S3Client } = require("@aws-sdk/client-s3");

module.exports = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});
