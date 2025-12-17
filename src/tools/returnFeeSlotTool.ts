import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const returnFeeSlot = tool(
  (res) => {
    return res;
  },
  {
    name: "returnFeeSlot",
    description: "提取关键信息后调用函数，进行回答",
    schema: z.object({
      company: z.string().nullable().describe("公司名称（可选）"),
      project: z.string().nullable().describe("缴费项目名称（可选）"),
      phoneTail: z.number().nullable().describe("负责人电话（可选）"),
      owner: z.string().nullable().describe("负责人名称（可选）"),
    }),
  }
);
