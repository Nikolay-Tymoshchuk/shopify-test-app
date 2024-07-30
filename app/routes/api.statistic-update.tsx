import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {json} from "@remix-run/node";

import {addOneToStatistic} from "~/models/Statistic.server";
import {authenticate} from "~/shopify.server";

import type {CurrentSessionType} from "@/types/offer.type";

export const loader = async ({request}: LoaderFunctionArgs) => {
  await authenticate.public.checkout(request);
};

/**
 * The point necessary for analytics. After successful purchase from post-purchase extension
 * we need to send the details like id of funnel, discount amount and total selling price of product(s).
 * This data nested in the body of the request.
 */

export const action = async ({request}: ActionFunctionArgs) => {
  const {cors, sessionToken} = await authenticate.public.checkout(request);

  const shop = (sessionToken as CurrentSessionType).input_data.shop.domain;
  const body = await request.json();

  await addOneToStatistic({shop, ...body});

  return cors(json({success: true}));
};
