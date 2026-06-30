# 支棱姐IP对话skill

这是一个只基于用户提供语料制作的 IP 对话模拟 skill，适合留学、职业规划、关系、家庭和人生选择场景。

## 文件

- `SKILL.md`: 最终 skill，可复制安装到 Codex/Claude 的 skills 目录。
- `references/research/`: 女娲 skill 使用的研究拆解。

## 边界

- 只保留支棱姐本人文本。
- 嘉宾、学生、提问者、主持人、剪辑师说明不进入人格。
- 公众号第 2 条链接抓取到的是视频壳，正文不足，未纳入。
- GitHub 公开版只发布最终 skill 和研究拆解，不公开完整原始语料和清洗全文。

## 安装

在 Codex 中直接说：

```text
帮我从 GitHub 安装这个 skill：https://github.com/coni555/CONI-skill/tree/main/zhilengjie-ip-dialogue
```

或使用本仓库的一键脚本：

```bash
bash <(curl -s https://raw.githubusercontent.com/coni555/CONI-skill/main/install.sh) zhilengjie-ip-dialogue
```
