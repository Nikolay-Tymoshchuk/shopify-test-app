import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {json} from "@remix-run/node";

import {getAllFunnelsTriggerProductsIds, getOffer,} from "~/models/Funnel.server";
import {getSession} from "~/models/Session.server";
import {authenticate} from "~/shopify.server";

import type {CurrentSessionType} from "@/types/offer.type";

export const loader = async ({request}: LoaderFunctionArgs) => {
  await authenticate.public.checkout(request);
};

export const action = async ({request}: ActionFunctionArgs) => {
  const {cors, sessionToken} = await authenticate.public.checkout(request);

  /**
   * Get the list of product ids(string) from all products in the offer
   */
  const lineItemsProductsIds = (
    sessionToken as CurrentSessionType
  ).input_data.initialPurchase.lineItems.map((item) =>
    item.product.id.toString(),
  );

  /**
   * Get the list of triggered product ids(strings) from all existed funnels
   */
  const idsOfTriggeredProducts = await getAllFunnelsTriggerProductsIds();

  /**
   * Check if some products from the offer exist in some funnels and return array of common products ids for next calculations
   */
  function countCommonElements(
    offersIds: string[],
    triggersIds: string[],
  ): string[] {
    const commonElements = offersIds.filter((element) =>
      triggersIds.includes(element),
    );

    return commonElements.length
      ? commonElements.map((idLikeInt) => `gid://shopify/Product/${idLikeInt}`)
      : [];
  }

  /**
   * Get the list of product ids that exist in the offer and in some funnels
   */
  const productsIdsExistedInFunnels = countCommonElements(
    lineItemsProductsIds,
    idsOfTriggeredProducts,
  );

  /**
   * If there are no products from the offer in the funnels, return null
   */
  if (productsIdsExistedInFunnels.length === 0) {
    return cors(json({offer: null}));
  }

  const shop = (sessionToken as CurrentSessionType).input_data.shop.domain;
  const tokenRecord = await getSession(shop);

  /**
   * Authenticate request with the shopify session token
   */
  if (!tokenRecord) {
    return cors(json({offer: null}));
  }

  /**
   * Get the necessary offer for the products that exist in the funnels
   */
  const offer = await getOffer(
    productsIdsExistedInFunnels,
    shop,
    tokenRecord.accessToken,
  );

  return cors(json({offer}));
};
