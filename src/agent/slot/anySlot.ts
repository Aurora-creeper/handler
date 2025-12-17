import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Talker } from "../../types";

/*
  一个通用提槽的示例，适用于槽位不能提前明确的业务场景。

  如果确定需要什么槽位的话，可以靠 function call 提供给 LLM，这样准确性非常高。

  请谨慎使用这个。
*/

const model = new ChatOpenAI({
  model: "deepseek-chat",
  apiKey: process.env.DEEPSEEK_API_KEY,
  configuration: {
    baseURL: "https://api.deepseek.com",
  },
  temperature: 0.1,
});

export async function basicChat(text: string, talker: Talker) {
  const response = await model.invoke([
    new SystemMessage(`
你是一个专业的信息提取助手。请从用户输入中提取关键信息, 并按照指定的JSON格式返回。

提取规则：
1. 仔细分析用户的完整输入
2. 只提取明确提到的信息，不要猜测或编造
3. 如果某个字段用户没有提及, 返回null
4. 姓名可以是中文、英文或昵称
5. 电话号码可以是手机号或座机
6. 地址要尽可能完整

请返回如下格式的JSON:
{
  "name": {
    "value": "提取的姓名, 如没有则为null",
    "confidence": "high/medium/low"
  },
  "phone": {
    "value": "提取的电话号码, 如没有则为null", 
    "confidence": "high/medium/low"
  },
  "email": {
    "value": "提取的邮箱地址, 如没有则为null",
    "confidence": "high/medium/low"  
  },
  "address": {
    "value": "提取的地址信息, 如没有则为null",
    "confidence": "high/medium/low"
  },
  "intent": {
    "value": "用户意图（咨询/预约/投诉/其他）",
    "confidence": "high/medium/low"
  }
}

示例：
输入："我叫张三, 电话是13812345678, 想预约明天下午3点的服务"
输出：
{
  "name": {"value": "张三", "confidence": "high"},
  "phone": {"value": "13812345678", "confidence": "high"},
  "email": {"value": null, "confidence": null},
  "address": {"value": null, "confidence": null},
  "intent": {"value": "预约", "confidence": "high"}
}

请严格按照上述JSON格式返回, 不要包含其他文字说明。
    `),
    new HumanMessage(text),
  ]);

  return response.content;
}


