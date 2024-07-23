import { json } from "@remix-run/node";

import { getAllFunnelsTriggerProductsIds } from "../models/Funnel.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
};

export const action = async () => {
  const funnelTriggerProductIds = await getAllFunnelsTriggerProductsIds();
  return json(funnelTriggerProductIds);
};
