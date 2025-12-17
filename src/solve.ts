import { Request, Response } from "express";
import { FrontMessage } from "./types/message";
import { talkerPool } from "./talker/pool";
import { makeSortNew } from "./agent/makeSortNew";
import { makeSortOld } from "./agent/makeSortOld";
import { MessageStructure, ToolMessage } from "@langchain/core/messages";
import { mainControl } from "./workflow/mainControl";

export async function solve(req: Request, res: Response) {
  const { type, content, userId, timestamp } = req.body as FrontMessage;

  const talker = talkerPool.makeSure(userId);

  talker.activeAt = new Date();

  let result: { type: number } | ToolMessage<MessageStructure> | undefined;

  if (talker.inFlowData === null) {
    // 没有工作流，进行意图判断
    result = await makeSortNew(content, talker);
  } else {
    // 先前有工作流，先进行意图判断，然后分发给工作流处理
    result = await makeSortOld(content, talker);
  }

  // [兜底] 意图判断失效
  if (typeof result?.type !== "number") {
    console.error("意图判断失效");
    return res.json({
      type: "error",
      content: "意图判断失效",
      userId,
      timestamp: Date.now(),
    });
  }

  // 分发给工作流
  const msg = await mainControl.dispatch(result.type, talker, content);

  return res.json({
    type,
    content: msg,
    userId,
    timestamp: Date.now(),
    flowId: result.type,
  });
}
