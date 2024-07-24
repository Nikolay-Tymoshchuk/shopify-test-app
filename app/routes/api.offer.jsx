import { json } from "@remix-run/node";

import {
  getAllFunnelsTriggerProductsIds,
  getOffer,
} from "../models/Funnel.server";
import { getSession } from "../models/Session.server";
import { authenticate } from "../shopify.server";

// import { getOffers } from "../models/Offer.server";

export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);

  /**
   * Get the list of product ids(string) from all products in the offer
   */
  const lineItemsProductsIds =
    sessionToken.input_data.initialPurchase.lineItems.map((item) =>
      item.product.id.toString(),
    );

  /**
   * Get the list of triggered product ids(strings) from all exist funnels
   */
  const idsOfTriggeredProducts = await getAllFunnelsTriggerProductsIds();

  /**
   * Check if some products from the offer are exist in some funnels and return array of common products ids for next calculations
   * @param {string[]} offersIds
   * @param {string[]} triggersIds
   * @returns {string[]}
   */
  function countCommonElements(offersIds, triggersIds) {
    const commonElements = offersIds.filter((element) =>
      triggersIds.includes(element),
    );
    return commonElements.length
      ? commonElements.map((idLikeInt) => `gid://shopify/Product/${idLikeInt}`)
      : [];
  }

  const productsIdsExistedInFunnels = countCommonElements(
    lineItemsProductsIds,
    idsOfTriggeredProducts,
  );

  if (productsIdsExistedInFunnels.length === 0) {
    return cors(json({ offer: null }));
  }

  const shop = sessionToken.input_data.shop.domain;
  const { accessToken } = await getSession(shop);
  const offer = await getOffer(productsIdsExistedInFunnels, shop, accessToken);

  return cors(json({ offer }));
};
