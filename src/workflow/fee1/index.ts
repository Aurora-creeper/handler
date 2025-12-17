import { basicChat } from "../../agent/basicChat";
import { Talker } from "../../types";
import { WorkFlow } from "../../types/flow";
import { mainControl } from "../mainControl";

const FlowID = 1;

function check(talker: Talker) {
  // http://111.229.188.40:3000/api/companies/names
}

const visit = async (talker: Talker, message: string) => {
  if (talker.inFlowData === null || talker.inFlowData.flowId !== FlowID) {
    talker.inFlowData = {
      flowId: FlowID,
      step: 0,
      metadata: {
        company: { value: "", checked: false },
        project: { value: "", checked: false },
        phone: { value: "", checked: false },
        owner: { value: "", checked: false },
      },
    };
  }

  if (talker.inFlowData.step === 0) {
    //
  } else if (talker.inFlowData.step === 1) {
    const res = String(await basicChat(message, talker));
    return res;
  }
};

export const fee1: WorkFlow = {
  name: `fee1`,
  visit,
};

mainControl.registerFlow(FlowID, fee1);
