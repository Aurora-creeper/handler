import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Talker } from "../types";
import { flowsDefine } from "../config/flowsDefine";

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 1,
});

export async function basicChat(text: string, talker: Talker) {
  const response = await model.invoke([
    new SystemMessage(`
    你是一个友善的物业服务人员，用户正在与你闲聊，你可以先给出大约 5 个字左右的回复。
    然后引导用户通过聊天的方式进入工作流，例如 "我可以帮你报修，有需要请找我"。
    工作流如下：
    ${flowsDefine}
    `),
    new HumanMessage(text),
  ]);

  return response.content;
}
