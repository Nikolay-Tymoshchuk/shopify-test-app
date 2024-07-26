import type { JwtPayload } from "@shopify/shopify-app-remix/server";

type InputData = {
  token: string | null;
  shop: Shop;
  initialPurchase: InitialPurchase;
};

type Shop = {
  id: number;
  domain: string;
  metafields: Array<string>;
};

type InitialPurchase = {
  referenceId: string;
  customerId: string;
  destinationCountryCode: string;
  totalPriceSet: InitialPurchaseTotalPriceSet;
  lineItems: Array<InitialPurchaseLineItem>;
};

type InitialPurchaseTotalPriceSet = {
  shopMoney: MoneySet;
  presentmentMoney: MoneySet;
};

type MoneySet = {
  amount: string;
  currencyCode: string;
};

type InitialPurchaseLineItem = {
  totalPriceSet: InitialPurchaseTotalPriceSet;
  quantity: number;
  product: Product;
  sellingPlanId: string;
};

type Product = {
  id: number;
  title: string;
  variant: any;
  metafields: Array<string>;
};

export type CurrentSessionType = JwtPayload & {
  input_data: InputData;
};
