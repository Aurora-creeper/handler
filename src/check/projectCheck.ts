import axios from "axios";
import { sameCheck } from "../agent/sameCheck";
import { getPinyin } from "../pinyin";

type ProjectCheckResult = {
  value: null | string;
  id: null | number;
  checked: boolean;
};

export async function projectCheck(
  name: string | null
): Promise<ProjectCheckResult> {
  let ret: ProjectCheckResult = {
    value: null,
    id: null,
    checked: false,
  };

  if (name === null) return ret;

  console.log(`开始检查 Project`);

  const py = getPinyin(name);

  // 第一层 mysql 按编辑距离，筛选 top 10
  const some = (
    await axios.get(
      `http://111.229.188.40:3000/api/payment-items/name/search/${py}`
    )
  ).data.data as Record<string, any>;

  // LLM 二次处理候选项，做语义判断
  const checkResult = await sameCheck(
    JSON.stringify(some),
    `${name}
        ${py}
        `
  );

  if (checkResult === false) {
    // 模型没有进行工具调用
    ret.value = null;

    ret.checked = false;

    console.error(new Error("模型没有进行工具调用"));
  } else {
    const id = checkResult.args.id as null | number;

    if (id === null) {
      // 模型认为不存在匹配的对象
      ret.value = null;

      ret.checked = false;

      console.log(`模型认为不存在匹配的 Project`);
    } else {
      // 存在匹配的项目名称

      ret.id = id;

      for (const key in some) {
        if (!Object.hasOwn(some, key)) continue;

        const element = some[key];

        if (element.id === id) ret.value = element.name;
      }

      ret.checked = true;

      console.log(`存在匹配的 Project: ${ret.value}`);
    }
  }

  return ret;
}
