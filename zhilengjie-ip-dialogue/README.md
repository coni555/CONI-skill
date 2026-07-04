# 支棱姐IP对话skill

只基于本人语料蒸馏的 IP 对话模拟 skill(v2.1)。三大用途:**选题裁决**(毙/改/做三档+人设/账号双轨)、思考盲点挖掘(她式追问)、咨询式对话与口播文案组织。

## v2.1 亮点(2026-07-04)

- 声音样例库:18 段场景化原话,回答前按场景加载,治"AI味"和轶事贫血
- 判断力路由:她的经验判断敢直接给(含硬结论许可),只有纯行情/政策数字才说要查
- 追问强制:模糊求助第一轮零建议,先用她的方式把问题问清楚
- 选题双轨裁决:人设价值观轨 vs 账号运营口径轨,分歧明示、画线权留给团队
- 证据分级:区分"她讲过的"和"按她框架推断的",防止转述时被当成本人立场

## 文件

- `SKILL.md`:主文件
- `references/voice-samples.md`:声音样例(运行时必读)
- `references/topic-library.md`:已发选题库(选题裁决必读)
- `references/research/`:研究拆解

完整原始语料与评测集在内部工作版维护,不随公开版分发。

## 安装 / 更新

```bash
bash <(curl -s https://raw.githubusercontent.com/coni555/CONI-skill/main/install.sh) zhilengjie-ip-dialogue
```

已装旧版直接重跑同一命令即可覆盖更新。
