import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getAllFunnels } from "../models/Funnel.server";

export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);

  const shop = sessionToken.input_data.shop.domain;

  const funnels = await getAllFunnels(shop);

  return cors(json({ funnels }));
};
