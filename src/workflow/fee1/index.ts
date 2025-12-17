import axios from "axios";
import { basicChat } from "../../agent/basicChat";
import { Talker } from "../../types";
import { WorkFlow } from "../../types/flow";
import { mainControl } from "../mainControl";
import { getPinyin } from "../../pinyin";
import { sameCheck } from "../../agent/slot/sameCheck";
import { feeSlot } from "../../agent/slot/feeSlot";

const FlowID = 1;

type FlowData = {
  flowId: number;
  step: number;
  metadata: Metadata;
};

type Metadata = {
  company: { value: null | string; checked: boolean };
  project: { value: null | string; checked: boolean };
  phone: { value: null | string; checked: boolean };
  owner: { value: null | string; checked: boolean };
};

async function check(talker: Talker<FlowData>) {
  // http://111.229.188.40:3000/api/companies/names
  const data = talker.inFlowData!.metadata;
  const must: string[] = [];
  const optional: string[] = [];

  if (!data.company.checked) {
    if (data.company.value !== null) {
      console.log("开始检查公司名称");
      const py = getPinyin(data.company.value);

      const some = (
        await axios.get(
          `http://111.229.188.40:3000/api/companies/nameSearch/${py}`
        )
      ).data.data as object;

      const checkResult = await sameCheck(
        JSON.stringify(some),
        `${data.company.value}
        ${py}
        `
      );

      if (checkResult === false) {
        data.company.value = null;
        data.company.checked = false;
      } else {
        const id = checkResult.args.id as null | number;
        if (id !== null) {
          data.company.checked = true;
        }
      }
    }

    if (!data.company.checked) must.push("公司名称");
  }

  if (!data.project.checked) must.push("缴费项目名称");

  if (data.phone.checked || data.owner.checked) {
    // 如果有一个合法，则合法
    // skip
  } else {
    if (!data.phone.checked) optional.push("手机末四位");
    if (!data.owner.checked) optional.push("负责人姓名");
  }

  if (must.length == 0 && optional.length == 0) {
    return true;
  }

  return { must, optional };
}

async function visit(talker: Talker<FlowData>, message: string) {
  if (talker.inFlowData === null || talker.inFlowData.flowId !== FlowID) {
    talker.inFlowData = {
      flowId: FlowID,
      step: 0,
      metadata: {
        company: { value: null, checked: false },
        project: { value: null, checked: false },
        phone: { value: null, checked: false },
        owner: { value: null, checked: false },
      },
    };
  }

  const metadata = talker.inFlowData.metadata;
  let checkResult: Awaited<ReturnType<typeof check>>;

  // 检查 metadata 是否已经满足
  checkResult = await check(talker);
  if (checkResult === true) talker.inFlowData.step = 1;

  // 若不满足，进入提槽环节
  if (talker.inFlowData.step === 0) {
    console.log("进入提槽环节");
    console.log(talker.inFlowData);

    const res = await feeSlot(message, talker);

    if (res === false) {
      console.log("提槽环节失败");
    } else {
      const { company, project, phoneTail, owner } = res.args;
      if (company && metadata.company.checked === false)
        metadata.company.value = company;
      if (project && metadata.project.checked === false)
        metadata.project.value = project;
      if (phoneTail && metadata.phone.checked === false)
        metadata.phone.value = phoneTail;
      if (owner && metadata.owner.checked === false)
        metadata.owner.value = owner;
    }

    console.log("结束提槽环节");
    console.log(talker.inFlowData);
  }

  // 检查 metadata 是否已经满足
  checkResult = await check(talker);
  if (checkResult === true) talker.inFlowData.step = 1;
  else {
    // 若不满足，开始提示用户
    const { must, optional } = checkResult;
    const res = String(await basicChat(message, talker));
    return res;
  }

  // 如果 metadata 已经满足
  if (talker.inFlowData.step === 1) {
    // 查询环节
    const res = String(await basicChat(message, talker));
    return res;
  }

  return "";
}

export const fee1: WorkFlow<FlowData> = {
  name: `fee1`,
  visit,
};

mainControl.registerFlow(FlowID, fee1);
