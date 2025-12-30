import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const getCancelCheck = tool(
  ({ res }) => {
    return { type: res };
  },
  {
    name: "getCancelCheck",
    description: "回答用户是否表现了取消的意图",
    schema: z.object({
      res: z.boolean().describe("是否取消"),
    }),
  }
);
