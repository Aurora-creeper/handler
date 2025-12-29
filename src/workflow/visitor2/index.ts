import axios from "axios";
import { Talker } from "../../types";
import { WorkFlow } from "../../types/flow";
import { mainControl } from "../mainControl";
import { visitorSlot } from "../../agent/slot/visitorSlot";
import { visitorSummary } from "../../agent/visitorSummary";
import { companyCheck } from "../../check/companyCheck";

const FlowID = 2;

type FlowData = {
  flowId: number;
  step: number;
  metadata: Metadata;
};

type Metadata = {
  company: { value: null | string; id: null | number; checked: boolean };
  time: { value: null | number; id: null | number; checked: boolean };
  name: { value: null | string; id: null | number; checked: boolean };
  phone: { value: null | string; id: null | number; checked: boolean };
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

  await chk1;

  if (!data.time.checked) {
    if (!data.time.value) {
      data.time.value = 1;
    } else {
      data.time.value = Math.max(1, Math.min(3, data.time.value));
    }
    data.time.checked = true;
  }

  if (!data.name.value) {
    must.push("你的姓名");
  }

  if (!data.phone.value) {
    must.push("你的手机号");
  }

  if (must.length == 0 && optional.length == 0) {
    return true;
  }

  return { must, optional };
}

async function visit(talker: Talker<FlowData>, message: string) {
  if (talker.inFlowData === null || talker.inFlowData.flowId !== FlowID) {
    // 初始化 metadata
    talker.inFlowData = {
      flowId: FlowID,
      step: 0,
      metadata: {
        company: { value: null, id: null, checked: false },
        time: { value: null, id: null, checked: false },
        name: { value: null, id: null, checked: false },
        phone: { value: null, id: null, checked: false },
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

    const res = await visitorSlot(message, talker);

    if (res === false) {
      console.error(new Error("提槽环节 visitorSlot 没有函数调用"));
    } else {
      const { company, time, name, phone } = res.args;
      if (company && metadata.company.checked === false)
        metadata.company.value = company;
      if (time && metadata.time.checked === false) metadata.time.value = time;
      if (name && metadata.name.checked === false) metadata.name.value = name;
      if (phone && metadata.phone.checked === false)
        metadata.phone.value = phone;
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
    let res = `您提供的信息有所缺失，请再完善以下信息：`;
    if (must.length > 0) res += `${must.join(", ")}`;
    return res;
  }

  // 如果 metadata 已经满足
  if (talker.inFlowData.step === 1) {
    // 查询环节
    const cid = talker.inFlowData.metadata.company.id;
    const pid = talker.inFlowData.metadata.name.id;

    return "ok";

    const some = (
      await axios.get(
        `http://111.229.188.40:3000/api/flow/feeFlow?companyId=${cid}&paymentItemId=${pid}`
      )
    ).data.data as Record<string, any>;

    const res = String(await visitorSummary(JSON.stringify(some)));

    talker.inFlowData = null;

    return res;
  }

  console.error(new Error("内部错误"));
  return "内部错误";
}

export const visitor2: WorkFlow<FlowData> = {
  name: `visitor2`,
  visit,
};

mainControl.registerFlow(FlowID, visitor2);
