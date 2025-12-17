import { Talker } from "../types";

class TalkerPool {
  pool: Map<string, Talker> = new Map();

  has(userId: string) {
    return this.pool.has(userId);
  }

  get(userId: string) {
    return this.pool.get(userId);
  }

  set(userId: string, talker: Talker) {
    this.pool.set(userId, talker);
  }

  delete(userId: string) {
    this.pool.delete(userId);
  }

  makeSure(userId: string): Talker {
    if (!this.has(userId)) {
      this.set(userId, {
        userId,
        activeAt: new Date(),
        inFlowData: null,
        keepTopic: false,
      });
    }

    return this.get(userId) as Talker;
  }
}

export const talkerPool = new TalkerPool();
