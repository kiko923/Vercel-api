const path = require('path');
const fs = require('fs');
const axios = require('axios');
const COS = require('cos-nodejs-sdk-v5');

// 初始化 COS 客户端
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY
});

// 获取中国上海时间
const getShanghaiDate = () => {
    const date = new Date();
    const utcOffset = date.getTimezoneOffset() * 60000; // 当前时区偏移时间
    const shanghaiTime = new Date(date.getTime() + utcOffset + 8 * 3600000); // UTC+8 时区时间
    return shanghaiTime;
};

// 格式化日期
const date = getShanghaiDate();
const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

// 下载图片到临时文件
async function downloadImage(url, filePath) {
    const response = await axios({
        url,
        responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        response.data.pipe(stream);
        stream.on('finish', () => resolve());
        stream.on('error', reject);
    });
}

// 从接口获取图片链接
async function fetchImageUrl(picType) {
    try {
        const response = await axios.get(`https://vercel-api-123.vercel.app/api/bing?pic=${picType}&type=json`);
        if (response.data && response.data.code === 200) {
            return response.data.imageUrl; // 获取图片链接
        } else {
            throw new Error('Failed to fetch image URL from API');
        }
    } catch (error) {
        console.error('Error fetching image URL:', error);
        throw error;
    }
}

// 上传图片到腾讯云 COS
async function uploadImage(imageUrl, fileName) {
    const bucket = 'images-1300109351'; // 替换为你的Bucket名称
    const key = `bingImg/${fileName}.jpg`; // 使用日期作为图片文件名
    const localFilePath = path.resolve('/tmp', `${fileName}.jpg`); // 将文件存储在 /tmp 目录

    try {
        // 下载图片到 /tmp 目录
        await downloadImage(imageUrl, localFilePath);

        // 上传图片到 COS
        const result = await cos.putObject({
            Bucket: bucket,
            Region: 'ap-guangzhou', // 替换为你的区域
            Key: key,
            Body: fs.createReadStream(localFilePath),
            ACL: 'public-read' // 设置访问权限为公开
        });

        return result.Location;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// 主处理函数
export default async function handler(req, res) {
    try {
        // 获取1k和4k图片链接
        const [imageUrl1k, imageUrl4k] = await Promise.all([
            fetchImageUrl('1k'),
            fetchImageUrl('4k')
        ]);

        const fileName1k = `${formattedDate}_1k`;
        const fileName4k = `${formattedDate}_4k`;

        // 并行上传1k和4k图片
        const [location1k, location4k] = await Promise.all([
            uploadImage(imageUrl1k, fileName1k),
            uploadImage(imageUrl4k, fileName4k)
        ]);

        res.status(200).json({
            message: 'Both images uploaded successfully',
            locations: {
                image1k: location1k,
                image4k: location4k
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'File upload failed', error: error.message });
    }
}