import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Talker } from "../../types";
import { returnFeeSlot } from "../tools/returnFeeSlotTool";

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 0.1,
}).bindTools([returnFeeSlot]);

export async function feeSlot(text: string, talker: Talker) {
  const response = await model.invoke([
    new SystemMessage(`
你是一个提槽专家，从用户输入中提取信息, 并通过 Function Call 来返回关键信息。
请注意，你的任务是专注于提取关键信息，不要回答用户的问题，不要进行追问。

用户信息很可能是不完整的，模糊的：
1. 只提取已有的信息，对于无法提取到的信息，返回 null。 
2. 不要对模糊的内容进行确认或询问，只需要提取信息。

严格禁止：
1. 追问用户细节。
2. 回答用户的问题。
3. 返回 null 的字符串，而非 null。

严格执行：
1. 在提取完内容后，立刻使用工具调用，返回提取到的内容。
2. 不论是否模糊，尽可能地填入信息。
3. 必须使用工具调用。

以下是用户的历史输入，你需要结合历史信息进行判断：
${JSON.stringify(talker.inFlowData!.metadata)}

`),
    new HumanMessage(text),
  ]);

  if (response.tool_calls && response.tool_calls.length > 0) {
    // 处理 null 字符串
    const tc = response.tool_calls[0];
    const args = tc.args as Record<string, any>;
    for (const key in args) {
      if (!Object.hasOwn(args, key)) continue;
      if (args[key] == "null") args[key] = null;
    }
    return tc;
  }

  return false;
}
