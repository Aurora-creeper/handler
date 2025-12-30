import { z } from "zod";
import { tool } from "@langchain/core/tools";

export const negativeCheckTool = tool(
  ({ type }) => {
    return { type };
  },
  {
    name: "negativeCheckTool",
    description: "回答意图是否是否认性的",
    schema: z.object({
      type: z.boolean().describe("肯定则返回 true，否则返回 false"),
    }),
  }
);
