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

export async function visitorSummary(text: string) {
  const response = await model.invoke([
    new SystemMessage(`
你是一个物业管理专家，用户刚刚提交了访问楼内某公司的工单，请总结访问信息，并用说话的格式返回文字。

参考格式如下：
xxx 您好，您对 xxx 公司的访问申请已提交，访问时长 x 天，请等待对方审核。
    `),
    new HumanMessage(text),
  ]);

  return response.content;
}
