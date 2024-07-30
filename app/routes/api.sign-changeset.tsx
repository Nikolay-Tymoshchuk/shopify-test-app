import type {ActionFunctionArgs, LoaderFunctionArgs} from "@remix-run/node";
import {json} from "@remix-run/node";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";

import {SHOP_API_KEY, SHOP_API_SECRET} from "@/helpers/const";
import {authenticate} from "../shopify.server";

/**
 * The loader responds to preflight requests from Shopify
 */
export const loader = async ({request}: LoaderFunctionArgs) => {
  await authenticate.public.checkout(request);
};

/**
 * The action responds to the POST request from the extension.
 * Make sure to use the cors helper for the request to work.
 * It is necessary to return data in encrypted format for safety.
 */
export const action = async ({request}: ActionFunctionArgs) => {
  const {cors} = await authenticate.public.checkout(request);

  const {sub, changes} = await request.json();

  const payload = {
    iss: SHOP_API_KEY,
    jti: uuidv4(),
    iat: Date.now(),
    sub,
    changes,
  };

  const token = jwt.sign(payload, SHOP_API_SECRET);

  return cors(json({token}));
};
