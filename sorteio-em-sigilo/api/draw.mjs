import { handleApi } from '../worker.mjs';
export default { fetch(request) { return handleApi(request, { DRAW_SECRET: process.env.DRAW_SECRET }); } };
