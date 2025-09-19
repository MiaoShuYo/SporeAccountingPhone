### 目标
1. VS Code 中集成MCP
2. 使用MCP将注册页面功能补充完整
3. 使用MCP审查代码

### VS Code 集成 MCP
从 VS Code 1.102 版本开始，VS Code 中的 MCP 支持已全面可用，可以在设置中看是否启用。
![](https://i-blog.csdnimg.cn/direct/67c36d6b513f4984bc3ece3dde3742c4.png#pic_center)

在工作区中添加 .vscode/mcp.json 文件，mcp.json文件是MCP的主要配置文件，用于定义模型的行为和交互规则。这个文件包含模型信息配置、上下文管理配置、交互规则配置、安全设置和扩展配置等重要参数，通过这些配置可以精确控制AI模型的运行环境和交互方式。

### 动手操作
用到的MCP工具：
1. `apifox-mcp-server@latest`：用于获取Swagger API文档信息
2. `github MCP 服务`：用于获取GitHub仓库信息
3. `@modelcontextprotocol/server-sequential-thinking`：通过结构化思维流程提供动态反思性的问题解决工具，将复杂问题分解为可管理的步骤
4. github MCP 服务无法访问的备选方案,`gitee MCP 服务`：用于获取Gitee仓库信息

在mcp.json配置MCP：
```json
{
    "servers": {
        "sequential-thinking": {
            "command": "npx",
            "args": [
                "-y",
                "@modelcontextprotocol/server-sequential-thinking"
            ]
        },
        "孢子记账身份认证API 文档": {
            "command": "cmd",
            "args": [
                "/c",
                "npx",
                "-y",
                "apifox-mcp-server@latest",
                "--oas=http://14.103.224.141:8977/swagger/docs/v1/identity"
            ]
        },
        "github": {
            "url": "https://api.githubcopilot.com/mcp/",
            "headers": {
                "Authorization": "Bearer <YOUR GITHUB TOKEN>"
            }
        },
        "gitee": {
            "url": "https://api.gitee.com/mcp",
            "headers": {
                "Authorization": "Bearer <your personal access token>"
            }
        }
    },
    "inputs": []
}
```

克隆项目：
1. https://github.com/MiaoShuYo/SporeAccountingPhone.git 或 https://gitee.com/miaoshu_studio/SporeAccountingPhone.git
2. 辅助三个issue到克隆后的项目中
3. Github 申请token 地址：https://github.com/settings/personal-access-tokens
4. Gitee 申请token 地址：https://gitee.com/profile/personal_access_tokens

操作：
1. 在Agent 模式下选择GPT 4.1；
2. 在mcp.json 文件中点击每个MCP左上角的start 按钮启动服务；
3. 输入："列出代码库中所有的issue"；
4. 输入："帮我实现issue #3"；
5. 输入："帮我实现issue #4"；
6. 输入："帮我实现issue #5"；
7. 输入："将#1、#2、#3的issue关闭"；
8. 输入："帮我项目审查一下代码，列出代码中不规范以及可能存在问题的地方，每个问都在代码库中新建一个issue"。

>Tip：VS Code 最多支持128个MCP工具，超过128个会报错，在MCP配置里禁用掉不需要的工具即可。

>Tip：对于复杂问题，GPT 4.1 会主动调用sequential-thinking来拆解问题