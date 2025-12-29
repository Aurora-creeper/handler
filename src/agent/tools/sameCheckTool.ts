import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const sameCheckTool = tool(
  ({ id }) => {
    return { type: id };
  },
  {
    name: "getIntent",
    description: "选出最合适的对象后调用函数，进行回答",
    schema: z.object({
      id: z.number().nullable().describe("数字 id（可以为 null）"),
    }),
  }
);
