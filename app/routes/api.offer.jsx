import { json } from "@remix-run/node";

import { getFunnelByTriggerProductId } from "../models/Funnel.server";
import { getSession } from "../models/Session.server";
import { authenticate } from "../shopify.server";
import { getOffers } from "../models/Offer.setver";

export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);

  const productId =
    sessionToken.input_data.initialPurchase.lineItems[0].product.id;

  const triggerProductId = `gid://shopify/Product/${productId}`;

  const shop = sessionToken.input_data.shop.domain;

  const { accessToken } = await getSession(shop);

  // const funnel = await getFunnelByTriggerProductId(
  //   triggerProductId,
  //   shop,
  //   accessToken,
  // );

  const offers = getOffers(accessToken, triggerProductId);

  return cors(json({ offers }));
};
