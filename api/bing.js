export default async function handler(req, res) {
    // 检查是否传入 `cn=1` 或 `cn=true`
    const isCN = req.query.cn === '1' || req.query.cn === 'true';

    // 根据 `cn` 参数决定 `mkt` 的值
    const mkt = isCN ? 'zh-CN' : 'en-US';

    // 必应壁纸API URL
    const apiUrl = `https://bing.com/HPImageArchive.aspx?format=js&mkt=${mkt}&idx=0&n=1&uhd=1&uhdwidth=3840&uhdheight=2160`;

    try {
        // 使用 fetch 获取API响应
        const response = await fetch(apiUrl);
        const data = await response.json();

        // 提取图片的基本URL
        const imageBaseUrl = 'https://cn.bing.com';
        const imageUrl = imageBaseUrl + data.images[0].url;

        // 使用 split 去掉 URL 中的参数部分
        const imageUrlWithoutParams = imageUrl.split('&')[0];

        // 检查请求参数是否包含 `type=json`
        if (req.query.type === 'json') {
            // 返回图片URL作为JSON响应
            res.status(200).json({
                code: 200,  // HTTP 状态码
                mkt: mkt,   // 返回所使用的区域代码
                imageUrl: imageUrlWithoutParams  // 图片 URL
            });
        } else {
            // 302重定向至图片地址
            res.redirect(302, imageUrlWithoutParams);
        }
    } catch (error) {
        // 错误处理
        res.status(500).json({
            code: 500,
            error: '无法获取必应壁纸'
        });
    }
}
