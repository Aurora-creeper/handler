import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getCancelCheck } from "./tools/getCancelCheck";

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 0.1,
}).bindTools([getCancelCheck]);

export async function cancelCheck(text: string) {
  const response = await model.invoke([
    new SystemMessage(`
你是一个意图分析专家，你需要判断用户是否表示了取消意图。

例如：
* 我不要进行查询了（取消）
* 重新启动预约流程（重启）
* 我要取消流程
* 停止这个聊天
* 等其他情况 ......

严格禁止
1. 回答用户的问题
2. 进行追问

严格执行：
1. 必须使用工具调用。
    `),
    new HumanMessage(text),
  ]);

  if (response.tool_calls && response.tool_calls.length > 0) {
    // 处理 null 字符串
    const tc = response.tool_calls[0];

    return tc;
  }

  return false;
}
