import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 0.1,
});

export async function feeSummary(text: string) {
  const response = await model.invoke([
    new SystemMessage(`
你是一个物业费总结专家，从用户输入中提取信息，用纯文字总结物业费信息。

严格禁止
1. 回答用户的问题
2. 进行追问

完全遵守
1. 专注于总结物业费信息。
2. 详细罗列信息，但避免超过 100 字。
3. 不要使用表格或其他形式的总结。
4. 设定为语言交互场景，不要使用括号等符号
    `),
    new HumanMessage(text),
  ]);

  return response.content;
}
