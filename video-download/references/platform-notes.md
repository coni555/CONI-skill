# Platform Notes

## Bilibili

- **Cookies 几乎必须**: 大多数内容需要 `--cookies-from-browser chrome`，否则只能拿到 360p 或直接失败
- **高清需大会员**: 1080p+ (特别是 4K/HDR) 需要账号有大会员，cookies 里要包含大会员登录态
- **番剧地理限制**: 部分番剧仅限中国大陆 IP，海外需代理
- **分P视频**: 多P视频 yt-dlp 会当作 playlist 处理，用 `--range` 选择特定P
- **BV号**: 支持直接用 `https://www.bilibili.com/video/BVxxxxx` 格式

## YouTube

- **年龄限制**: 需 `--cookies-from-browser chrome`（要求已登录的浏览器）
- **Premium 内容**: 付费会员专属内容无法下载
- **Shorts**: 直接用原始 URL，yt-dlp 正常处理
- **直播**: 正在直播的内容会持续录制直到手动停止，建议用 `--live-from-start` 获取完整回放
- **字幕丰富**: 自动生成字幕覆盖多语言，用 `--write-auto-subs` 获取

## Twitter/X

- **受保护账号**: 需要 `--cookies-from-browser chrome`
- **画质固定**: 通常只有一种视频质量，不需要格式选择
- **Spaces**: 支持下载 Twitter Spaces 录音

## Instagram

- **必须登录**: 几乎所有内容都需要 `--cookies-from-browser chrome`
- **Reels/Stories/IGTV**: 都支持
- **私密账号**: 需要已关注该账号的浏览器 cookies

## Cookie 获取

推荐顺序：
1. `--cookies-from-browser chrome` （最常用）
2. `--cookies-from-browser firefox`
3. `--cookies-from-browser safari`

如果浏览器 cookie 提取失败（权限问题），提示用户：
- macOS 可能需要授予终端 "完全磁盘访问权限"
- 或使用浏览器扩展导出 cookies.txt，然后用 `--cookies cookies.txt`
