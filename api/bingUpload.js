// upload.js
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const path = require('path');

// 初始化 COS 客户端
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,  // 从环境变量中读取 SecretId
    SecretKey: process.env.COS_SECRET_KEY // 从环境变量中读取 SecretKey
});

// 获取当前日期，作为文件名
const date = new Date();
const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
  .toString()
  .padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

// 本地图片路径，可以从某个地方获取图片
const localFilePath = path.resolve(__dirname, 'localImage.jpg'); // 替换为你图片的实际路径

// 上传文件
async function uploadImage() {
    try {
        const bucket = 'images-1300109351'; // 替换为你的存储桶名称
        const key = `bingImg/${formattedDate}.jpg`; // 将文件名设为当前日期

        // 上传文件到腾讯云 COS
        const result = await cos.putObject({
            Bucket: bucket,
            Region: 'ap-guangzhou', // 替换为你存储桶的区域
            Key: key,
            Body: fs.createReadStream(localFilePath), // 从本地读取文件
            ACL: 'public-read' // 可选，设置文件的访问权限为公开可读
        });

        console.log(`文件上传成功，访问地址为：${result.Location}`);
    } catch (error) {
        console.error(`文件上传失败：${error.message}`);
    }
}

module.exports = uploadImage;
