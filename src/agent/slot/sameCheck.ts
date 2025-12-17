import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { sameCheckTool } from "../../tools/sameCheckTool";

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 0.1,
}).bindTools([sameCheckTool]);

const Prompt = `
你是一个相似度计算专家。
用户会输入一个字符串，你要从给定的数组中找到最相似的对象，并使用工具调用返回其 id。

数组里包含一些对象，每个对象有如下属性
{
    "id": 数字 id,
    "name": 名称字符串,
    "name_pinyin": 名称的拼音字符串,
    "similarity": 以编辑距离计算的相似度，仅供参考
}

严格执行：
1. 必须使用工具调用。
2. 如果你认为没有相似的对象，返回 null。
`;

export async function sameCheck(sys: string, text: string, prompt = Prompt) {
  const response = await model.invoke([
    new SystemMessage(
      `${prompt}

${sys}
`
    ),
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
