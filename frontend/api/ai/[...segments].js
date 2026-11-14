import { handleAiProxy } from "../../server/aiProxy.mjs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const apiOrigin = process.env.IGNIS_API_ORIGIN;
  if (!apiOrigin) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        detail: "The IGNIS_API_ORIGIN service binding is unavailable.",
      }),
    );
    return;
  }

  req.url = (req.url || "/").replace(/^\/api\/ai(?=\/|\?)/, "/ai");

  await handleAiProxy(req, res, {
    apiOrigin,
    nimApiKey: process.env.IGNIS_NIM_API_KEY,
  });
}
