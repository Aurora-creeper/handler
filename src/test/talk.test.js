const url = "http://localhost:8000/chat";

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    type: "feature",
    from: "frontend",
    to: "server",
    content: "温柔是你的美，天气真魅力",
    userId: "SongBiao",
    timestamp: Date.now(),
  }),
});

const result = await response.json();
console.log(result);
