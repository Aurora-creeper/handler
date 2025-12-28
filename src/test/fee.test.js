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
    content: "帮我查询砌砖科技的水电缴费情况",
    userId: "SongBiao",
    timestamp: Date.now(),
  }),
});

let result = await response.json();
console.log(result);

//
//

response = await fetch(url, {
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

result = await response.json();
console.log(result);
