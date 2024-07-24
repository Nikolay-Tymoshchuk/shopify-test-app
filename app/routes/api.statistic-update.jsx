import { json } from "@remix-run/node";
import { addOneToStatistic } from "../models/Statistic.server";

import { authenticate } from "../shopify.server";

// The loader responds to preflight requests from Shopify
// export async function loader({ request, params }) {
//   const { cors, sessionToken } = await authenticate.public.checkout(request);

//   const [funnelId, token] = params.token.split("-");

//   console.log("TOKEN__TOKEN__TOKEN__TOKEN__TOKEN__TOKEN__TOKEN__==>", token);

//   try {
//     const decoded = jwt.verify(token, process.env.SHOPIFY_API_SECRET);

//     console.log("DECODED__DECODED__DECODED__DECODED__DECODED__==>", decoded);

//     const { changes } = decoded;

//     return json("success", { status: 200 });
//   } catch (error) {
//     console.error("Error decoding token:", error);
//     return json({ error: "Invalid token" }, { status: 400 });
//   }

export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);
  const shop = sessionToken.input_data.shop.domain;
  const body = await request.json();

  console.log("shop", shop);
  console.log("body", body);

  await addOneToStatistic({ shop, ...body });

  return cors(json({ success: true }));
};

// if (params.id === "new") {
//   return json({
//     destination: "funnel",
//     title: "",
//     triggeredIds,
//   });
// }
// const funnel = await getFunnel(Number(params.id), zhopa.graphql);

// return json({
//   ...funnel,
//   triggeredIds,
// });
// export const action = async ({ request }) => {
//   const req = await request;
//   const token = req.

//   // Декодирование токена
//   let decoded;
//   try {
//     decoded = jwt.verify(token, process.env.SHOPIFY_API_SECRET);
//   } catch (error) {
//     console.error("Error decoding token:", error);
//     return json({ error: "Invalid token" }, { status: 400 });
//   }

//   // Здесь вы можете обновить базу данных на основе декодированных данных
//   try {
//     // Предположим, что у вас есть функция updateStatistics в вашем модуле db
//     await db.updateStatistics(decoded.sub, decoded.changes);
//     return json({ success: true });
//   } catch (error) {
//     console.error("Database update error:", error);
//     return json({ error: "Database update failed" }, { status: 500 });
//   }
// };
