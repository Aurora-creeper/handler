import axios from "axios";
import { basicChat } from "../../agent/basicChat";
import { Talker } from "../../types";
import { WorkFlow } from "../../types/flow";
import { mainControl } from "../mainControl";
import { getPinyin } from "../../pinyin";
import { sameCheck } from "../../agent/sameCheck";
import { feeSlot } from "../../agent/slot/feeSlot";
import { feeSummary } from "../../agent/feeSummary";

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
};

async function check(talker: Talker<FlowData>) {
  const data = talker.inFlowData!.metadata;
  const must: string[] = [];
  const optional: string[] = [];

  async function makeCheck(
    key: keyof Metadata,
    description: string,
    api: string
  ) {
    const aimData = data[key];

    if (aimData.checked) return;

    if (aimData.value !== null) {
      console.log(`开始检查 ${key}`);

      const py = getPinyin(aimData.value);

      // 第一层 mysql 按编辑距离，筛选 top 10
      const some = (await axios.get(`${api}${py}`)).data.data as Record<
        string,
        any
      >;

      // LLM 二次处理候选项，做语义判断
      const checkResult = await sameCheck(
        JSON.stringify(some),
        `${aimData.value}
        ${py}
        `
      );

      if (checkResult === false) {
        // 模型没有进行工具调用
        aimData.value = null;

        aimData.checked = false;

        console.error(new Error("模型没有进行工具调用"));
      } else {
        const id = checkResult.args.id as null | number;

        if (id === null) {
          // 模型认为不存在匹配的对象
          aimData.value = null;

          aimData.checked = false;

          console.log(`模型认为不存在匹配的 ${key}`);
        } else {
          // 存在匹配的公司名称

          aimData.id = id;

          for (const key in some) {
            if (!Object.hasOwn(some, key)) continue;

            const element = some[key];

            if (element.id === id) aimData.value = element.name;
          }

          aimData.checked = true;

          console.log(`存在匹配的 ${key}: ${aimData.value}`);
        }
      }
    }

    // 如果依然缺失，加入 must 数组
    if (!aimData.checked) must.push(description);
  }

  const vecp: Promise<void>[] = [
    makeCheck(
      "company",
      "公司名称",
      "http://111.229.188.40:3000/api/companies/name/search/"
    ),
    makeCheck(
      "project",
      "缴费项目名称",
      "http://111.229.188.40:3000/api/payment-items/name/search/"
    ),
  ];

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
  if (checkResult === true) talker.inFlowData.step = 1;
  else {
    // 若不满足，开始提示用户
    const { must, optional } = checkResult;
    // const res = String(await basicChat(message, talker));
    //

    let res = `您提供的信息有所缺失，请再完善以下信息：`;
    if (must.length > 0) res += `${must.join(", ")}`;
    return res;
  }

  // 如果 metadata 已经满足
  if (talker.inFlowData.step === 1) {
    // 查询环节
    const cid = talker.inFlowData.metadata.company.id;
    const pid = talker.inFlowData.metadata.project.id;

    // const res = String(await basicChat(message, talker));
    const some = (
      await axios.get(
        `http://111.229.188.40:3000/api/flow/feeFlow?companyId=${cid}&paymentItemId=${pid}`
      )
    ).data.data as Record<string, any>;

    const res = String(await feeSummary(JSON.stringify(some)));

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
