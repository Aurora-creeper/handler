import { Talker } from "../types";
import { WorkFlow } from "../types/flow";

class MainControl {
  flows = new Map<number, WorkFlow>();

  async dispatch(flowId: number, talker: Talker, message: string) {
    const flow = this.flows.get(flowId);

    if (!flow) {
      console.error(`flow ${flowId} not found`);
      return null;
    }

    return await flow.visit(talker, message);
  }

  registerFlow(id: number, flow: WorkFlow) {
    if (this.flows.has(id)) {
      console.error(`flow ${id} has been registered`);
      return null;
    }
    this.flows.set(id, flow);
    return id;
  }
}

export const mainControl = new MainControl();
