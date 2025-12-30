import e, { Request, Response } from "express";
import { FrontMessage } from "./types/message";
import { talkerPool } from "./talker/pool";
import { makeSortNew } from "./agent/makeSortNew";
import { makeSortOld } from "./agent/makeSortOld";
import { MessageStructure, ToolMessage } from "@langchain/core/messages";
import { mainControl } from "./workflow/mainControl";
import { cancelCheck } from "./agent/cancelCheck";

export async function solve(req: Request, res: Response) {
  const { type, content, userId, timestamp } = req.body as FrontMessage;

  const talker = talkerPool.makeSure(userId);

  talker.activeAt = new Date();

  let result: { type: number } | ToolMessage<MessageStructure> | undefined;

  if (talker.inFlowData === null) {
    // 没有工作流，进行意图判断
    result = await makeSortNew(content, talker);
  } else {
    // 先前有工作流

    // 先判断是否有取消意图
    const needCancel = await cancelCheck(content);

    if (needCancel && needCancel.args.type === true) {
      // 如果用户希望取消，则取消用户的工作流
      talker.keepTopic = false;
      talker.inFlowData = null;
      result = { type: 4 };
      console.log("用户表达了取消工作流的意图");
    }

    if (talker.inFlowData && talker.keepTopic) {
      // 直接分发给工作流
      result = { type: talker.inFlowData.flowId };
    } else {
      // 进行意图判断，分发给工作流处理
      result = await makeSortOld(content, talker);
    }
  }

  if (typeof result?.type !== "number") {
    // [兜底] 意图判断失效

    console.error(new Error("意图判断失效"));

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
