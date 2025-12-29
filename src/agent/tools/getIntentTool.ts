import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const getIntentTool = tool(
  ({ id }) => {
    return { type: id };
  },
  {
    name: "getIntent",
    description: "回答意图分类",
    schema: z.object({
      id: z.number().describe("你分类得到的意图 ID"),
    }),
  }
);
