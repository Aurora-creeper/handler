import { basicChat } from "../../agent/basicChat";
import { Talker } from "../../types";
import { WorkFlow } from "../../types/flow";
import { mainControl } from "../mainControl";

const FlowID = 4;

const visit = async (talker: Talker, message: string) => {
  const res = String(await basicChat(message, talker));
  return res;
};

export const chat4: WorkFlow = {
  name: `chat4`,
  visit,
};

mainControl.registerFlow(FlowID, chat4);
