import { Talker } from ".";

export interface WorkFlow {
  name: string;
  /* 
    1. 返回机器人输出的内容
    2. [副作用] 修改 talker 的 inFlowData
  */
  visit(talker: Talker<any>, message: string): Promise<string> | string;
}
