import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getIntentTool } from "./tools/getIntentTool";
import { Talker } from "../types";

import dotenv from "dotenv";
import { flowsDefine } from "../config/flowsDefine";
dotenv.config();

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 0.1,
}).bindTools([getIntentTool]);

export async function makeSortOld(text: string, talker: Talker) {
  const { inFlowData } = talker;

  if (inFlowData == null) return;

  const num: number = inFlowData.flowId;

  const response = await model.invoke([
    new SystemMessage(`
  你是一个服务于物业的意图识别大师。
  你已知用户之前存在的意图是 ${num}，请结合用户新的输入，从给定的意图类型里选择最合适的。
  ${flowsDefine}
  `),
    new HumanMessage(text),
  ]);

  console.log("AI 回复：", response.content);

  if (response.tool_calls && response.tool_calls.length > 0) {
    const toolCall = response.tool_calls[0];
    console.log("🔧 工具调用：", toolCall);

    // @ts-expect-error
    const result = await getIntentTool.invoke(toolCall.args);

    console.log("✅ 工具结果：", result);

    return result;
  } else {
    console.log("🚫 意图判断失效");
    return undefined;
  }
}
