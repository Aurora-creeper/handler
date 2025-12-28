# step 0

metadata

```json
{
  "company": { "value": "", "checked": false },
  "project": { "value": "", "checked": false },
  "phone": { "value": "", "checked": false },
  "owner": { "value": "", "checked": false }
}
```

先获取近一年所有缴费项目名称，以及所有公司名称。

1. 提取槽位，不断合并进入 metadata
2. 判断 metadata 内容是否充足

- LLM 判断公司名称存在，标记 checked
- LLM 判断缴费项目存在，标记 checked

- 当满足 `公司名称存在`，才继续判断：
- LLM 判断负责人电话或者电话符合公司

若充足，进入 step 1

若不充足，返回 content 给 BOT，内容是不充足的项目，要求用户补全

# step 1

此时 metadata 已经是完整的，可以进入 step 2，开始查询数据。
