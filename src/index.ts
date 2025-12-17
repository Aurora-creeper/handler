import express from "express";
import { solve } from "./solve";
import "./sideEffect";

import __dotenv from "dotenv";
__dotenv.config();

export const app: express.Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/chat", solve);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
