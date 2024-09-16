// api/fetch-url.js

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ code: 400, msg: '请提供一个url参数' });
  }

  try {
    // 创建新的请求并添加 CF-IPCountry 头部，模拟美国地区请求
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        // 注意：Vercel 运行环境不允许设置 CF-IPCountry 头部
        // 这个头部是 Cloudflare 特有的，Vercel 不支持
        // 可以考虑在请求中直接传递必要的参数
      },
    });

    const finalUrl = response.url;

    return res.status(200).json({ code: 200, msg: '成功', url: finalUrl });
  } catch (error) {
    return res.status(500).json({ code: 500, msg: '发生错误: ' + error.message });
  }
}
