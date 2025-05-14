declare module 'express-sse' {
  import { Request, Response } from 'express';

  class SSE {
    constructor(options?: any);
    init(req: Request, res: Response): void;
    send(data: any, event?: string): void;
    updateInit(data: any): void;
    serialize(data: any): string;
  }

  export = SSE;
}
