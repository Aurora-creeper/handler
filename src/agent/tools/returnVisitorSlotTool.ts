import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const returnVisitorSlot = tool(
  (res) => {
    return res;
  },
  {
    name: "returnFeeSlot",
    description: "提取关键信息后调用函数，进行回答",
    schema: z.object({
      company: z.string().nullable().describe("希望访问的公司名称（可选）"),
      time: z.number().nullable().describe("访问天数（可选）"),
      name: z.string().nullable().describe("访客姓名（可选）"),
      phone: z.string().nullable().describe("访客手机号（可选）"),
    }),
  }
);
