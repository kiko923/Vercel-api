const path = require('path');
const fs = require('fs');
const axios = require('axios');
const COS = require('cos-nodejs-sdk-v5');

// 初始化 COS 客户端
const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY
});

const date = new Date();
const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

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

async function fetchImageUrl(picType) {
    try {
        const response = await axios.get(`https://api.617636.xyz/api/bing?pic=${picType}&type=json`);
        if (response.data && response.data.code === 200) {
            return response.data.imageUrl;
        } else {
            throw new Error('Failed to fetch image URL from API');
        }
    } catch (error) {
        console.error('Error fetching image URL:', error);
        throw error;
    }
}

async function uploadImage(imageUrl, fileName) {
    const bucket = 'images-1300109351';
    const key = `bingImg/${fileName}.jpg`;
    const localFilePath = path.resolve('/tmp', `${fileName}.jpg`);

    try {
        await downloadImage(imageUrl, localFilePath);

        const result = await cos.putObject({
            Bucket: bucket,
            Region: 'ap-guangzhou',
            Key: key,
            Body: fs.createReadStream(localFilePath),
            ACL: 'public-read'
        });

        return result.Location;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    try {
        const imageUrl1k = await fetchImageUrl('1k');
        const fileName1k = `${formattedDate}_1k`;
        const location1k = await uploadImage(imageUrl1k, fileName1k);

        res.status(200).json({
            message: '1k image uploaded successfully',
            location: location1k
        });
    } catch (error) {
        res.status(500).json({ message: '1k image upload failed', error: error.message });
    }
}
