export async function GET(request) {
  // 从请求头中获取客户端 IP 地址，可能是 IPv4 或 IPv6
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.socket.remoteAddress;
  const clientIp = ip ? ip.split(',')[0].trim() : 'IP not found';

  return new Response(
    JSON.stringify({
      ip: clientIp
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
      },
    }
  );
}
