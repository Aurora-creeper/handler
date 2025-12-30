import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { negativeCheckTool } from "./tools/negativeCheckTool";

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 0,
}).bindTools([negativeCheckTool]);

export async function negativeCheck(text: string) {
  const response = await model.invoke([
    new SystemMessage(`
你是一个物业管理人员，用户正在对一段提议进行反馈，请判断是否存在否认性的表述，并使用工具调用返回结果。

以下是肯定性表达：
1. 是的（肯定，返回 true）
2. 没问题，继续吧（肯定，返回 true）

以下是否定性表达：
1. 不（否定，返回 false）
2. 不对（否定，返回 false）
3. 否（否定，返回 false）
4. 重来（否定，返回 false）
5. 这个名字有问题（否定，返回 false）

严格执行：
1. 必须使用工具调用。
    `),
    new HumanMessage(text),
  ]);

  if (response.tool_calls && response.tool_calls.length > 0) {
    const tc = response.tool_calls[0];
    return tc.args;
  }
  return false;
}
