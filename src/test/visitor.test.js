const url = "http://localhost:8000/chat";

let response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "feature",
    from: "frontend",
    to: "server",
    content: "我要预约砌砖科技的访问，时间是今天下午，我叫送镖",
    userId: "SongBiao",
    timestamp: Date.now(),
  }),
});

let result = await response.json();
console.log(result);

{
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "feature",
      from: "frontend",
      to: "server",
      content: "我手机一八七，四二期，儿刘思思八",
      userId: "SongBiao",
      timestamp: Date.now(),
    }),
  });

  let result = await response.json();
  console.log(result);
}
