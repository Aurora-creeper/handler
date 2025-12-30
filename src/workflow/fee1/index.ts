import axios from "axios";
import { Talker } from "../../types";
import { WorkFlow } from "../../types/flow";
import { mainControl } from "../mainControl";
import { feeSlot } from "../../agent/slot/feeSlot";
import { feeSummary } from "../../agent/feeSummary";
import { companyCheck } from "../../check/companyCheck";
import { projectCheck } from "../../check/projectCheck";
import { negativeCheck } from "../../agent/negativeCheck";

const FlowID = 1;

type FlowData = {
  flowId: number;
  step: number;
  metadata: Metadata;
};

type Metadata = {
  company: { value: null | string; id: null | number; checked: boolean };
  project: { value: null | string; id: null | number; checked: boolean };
  phone: { value: null | string; id: null | number; checked: boolean };
  owner: { value: null | string; id: null | number; checked: boolean };
  tryComfirm: boolean;
};

async function check(talker: Talker<FlowData>) {
  const data = talker.inFlowData!.metadata;
  const must: string[] = [];
  const optional: string[] = [];

  const chk1 = data.company.checked
    ? Promise.resolve(true)
    : companyCheck(data.company.value).then((res) => {
        if (!res.checked) {
          must.push("公司名称");
        }
        Object.assign(data.company, res);
      });

  const chk2 = data.project.checked
    ? Promise.resolve(true)
    : projectCheck(data.project.value).then((res) => {
        if (!res.checked) {
          must.push("缴费项目名称");
        }
        Object.assign(data.project, res);
      });

  const vecp: Promise<unknown>[] = [chk1, chk2];
  await Promise.all(vecp);

  if (data.phone.checked || data.owner.checked) {
    // 如果有一个合法，则合法
    // skip
  } else {
    // if (!data.phone.checked) optional.push("手机末四位");
    // if (!data.owner.checked) optional.push("负责人姓名");
  }

  if (must.length == 0 && optional.length == 0) {
    return true;
  }

  return { must, optional };
}

async function slotStep(
  talker: Talker<FlowData>,
  message: string
): Promise<string | true> {
  if (talker.inFlowData === null) return Promise.resolve("内部错误");

  const metadata = talker.inFlowData.metadata;
  let checkResult: Awaited<ReturnType<typeof check>>;

  // 检查 metadata 是否已经满足
  // checkResult = await check(talker);
  // if (checkResult === true) {
  //   talker.inFlowData.step = 1;
  //   return Promise.resolve(true);
  // }

  // 若不满足，进入提槽环节
  if (talker.inFlowData.step === 0) {
    console.log("进入提槽环节");
    console.log(talker.inFlowData);

    const res = await feeSlot(message, talker);

    if (res === false) {
      console.error(new Error("提槽环节 feeSlot 没有函数调用"));
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
  if (checkResult === true) {
    talker.inFlowData.step = 1;
    return Promise.resolve(true);
  } else {
    // 若不满足，开始提示用户
    const { must, optional } = checkResult;
    let res = `您提供的信息有所缺失，请再完善以下信息：`;
    if (must.length > 0) res += `${must.join(", ")}`;
    return res;
  }
}

async function confirmStep(
  talker: Talker<FlowData>,
  message: string
): Promise<string | true> {
  if (talker.inFlowData === null) return Promise.resolve("内部错误");

  const res = await negativeCheck(message);
  if (res === false) {
    return Promise.resolve("内部错误");
  }

  return Promise.resolve(res.type);
}

async function visit(talker: Talker<FlowData>, message: string) {
  if (talker.inFlowData === null || talker.inFlowData.flowId !== FlowID) {
    // 初始化 metadata
    talker.inFlowData = {
      flowId: FlowID,
      step: 0,
      metadata: {
        company: { value: null, id: null, checked: false },
        project: { value: null, id: null, checked: false },
        phone: { value: null, id: null, checked: false },
        owner: { value: null, id: null, checked: false },
        tryComfirm: false,
      },
    };
  }

  // 提槽环节
  if (talker.inFlowData.step === 0) {
    const res = await slotStep(talker, message);
    if (typeof res === "string") {
      // 有提示
      return res;
    }
    talker.inFlowData.metadata.tryComfirm = true;
  }

  // 如果 metadata 已经满足，进入确认环节
  if (talker.inFlowData.step === 1) {
    // 下次强制转发到这个工作流
    talker.keepTopic = true;

    async function makeConfirm() {
      const { company, project } = talker.inFlowData!.metadata;
      return `
      您希望查询 ${company.value} 的 ${project.value} 吗？
      如果与期望不符，您可以回答否`;
    }

    if (talker.inFlowData.metadata.tryComfirm) {
      // 要求确认
      talker.inFlowData.metadata.tryComfirm = false;
      return await makeConfirm();
    }

    const res = await confirmStep(talker, message);
    if (res === true) {
      talker.inFlowData.step = 2;
    } else {
      talker.inFlowData.metadata.company.checked = false;
      talker.inFlowData.metadata.project.checked = false;
      talker.inFlowData.step = 0;
      return `好的，请您提供修正后的信息。`;
    }
  }

  // 如果 metadata 已经满足，进入查询环节
  if (talker.inFlowData.step === 2) {
    // 取消强制转发
    talker.keepTopic = false;

    // 查询环节
    const cid = talker.inFlowData.metadata.company.id;
    const pid = talker.inFlowData.metadata.project.id;

    const some = (
      await axios.get(
        `http://111.229.188.40:3000/api/flow/feeFlow?companyId=${cid}&paymentItemId=${pid}`
      )
    ).data.data as Record<string, any>;

    const res = String(await feeSummary(JSON.stringify(some)));

    talker.inFlowData = null;

    return res;
  }

  console.error(new Error("内部错误"));
  return "内部错误";
}

export const fee1: WorkFlow<FlowData> = {
  name: `fee1`,
  visit,
};

mainControl.registerFlow(FlowID, fee1);
