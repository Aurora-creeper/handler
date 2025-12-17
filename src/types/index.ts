import "./message";
import "./flow";

export interface Talker<T = FlowData> {
  userId: string;
  activeAt: Date;
  keepTopic: boolean;
  inFlowData: null | T;
}

export type FlowData = {
  flowId: number;
} & Record<string, any>;
