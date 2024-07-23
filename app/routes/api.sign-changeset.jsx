import { json } from "@remix-run/node";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { authenticate } from "../shopify.server";

// The loader responds to preflight requests from Shopify
export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
};
// The action responds to the POST request from the extension. Make sure to use the cors helper for the request to work.
export const action = async ({ request }) => {
  const { cors } = await authenticate.public.checkout(request);

  const body = await request.json();

  const selectedFunnel = body?.storage?.initialData?.offer;

  const payload = {
    iss: process.env.SHOPIFY_API_KEY,
    jti: uuidv4(),
    iat: Date.now(),
    sub: body.referenceId,
    changes: selectedFunnel?.changes,
  };

  const token = jwt.sign(payload, process.env.SHOPIFY_API_SECRET);
  return cors(json({ token }));
};
