const url = "http://localhost:8000/chat";

/**
 * 温柔是你的美，天气真魅力
 * 
 * 我家热得快炸了
 * 
 * 帮我查询信贷科技的水电缴费情况
 * 
 * 帮我查询信贷科技的第二季度水电缴费情况，负责人是阿妈，手机尾号 884818
 * 
 * 砌砖科技
 * 
 * 帮我查询砌砖科技的水电缴费情况
 * 
 * 查一下水费就行
 */

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "feature",
    from: "frontend",
    to: "server",
    content: "查一下水费就行",
    userId: "SongBiao",
    timestamp: Date.now(),
  }),
});

const result = await response.json();
console.log(result);
