export default async function handler(req, res) {
    // 必应壁纸API URL
    const apiUrl = "https://bing.com/HPImageArchive.aspx?format=js&mkt=en-US&idx=0&n=1&uhd=1&uhdwidth=3840&uhdheight=2160";

    try {
        // 使用 fetch 获取API响应
        const response = await fetch(apiUrl);
        const data = await response.json();

        // 提取图片的基本URL
        const imageBaseUrl = 'https://cn.bing.com';
        const imageUrl = imageBaseUrl + data.images[0].url;

        // 使用 split 去掉 URL 中的参数部分
        const imageUrlWithoutParams = imageUrl.split('&')[0];

        // 返回图片URL作为JSON响应
        res.status(200).json({
            imageUrl: imageUrlWithoutParams
        });
    } catch (error) {
        // 错误处理
        res.status(500).json({
            error: '无法获取必应壁纸'
        });
    }
}
