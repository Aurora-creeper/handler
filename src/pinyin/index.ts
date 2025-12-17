import { pinyin, addDict } from "pinyin-pro";
import CompleteDict from "@pinyin-pro/data/complete";

addDict(CompleteDict);

export function getPinyin(word: string) {
  return pinyin(word, { toneType: "num" });
}
