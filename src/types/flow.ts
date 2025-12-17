import { FlowData, Talker } from ".";

export interface WorkFlow<T = FlowData> {
  name: string;
  /* 
    1. 返回机器人输出的内容
    2. [副作用] 修改 talker 的 inFlowData
  */
  visit(talker: Talker<T>, message: string): Promise<string> | string;
}
