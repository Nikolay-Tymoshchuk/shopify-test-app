import type {JwtPayload} from "@shopify/shopify-app-remix/server";

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
  variant: Variant;
  metafields: Array<string>;
};

export type CurrentSessionType = JwtPayload & {
  input_data: InputData;
};

export type PurchaseOption = {
  id: number;
  productTitle: string;
  productImage: VariantImage | null;
  discount: number;
  changes: Array<Changes>;
  variants: Array<Variant>;
};

export type Changes = {
  type: string;
  variantId: string;
  quantity: number;
  discount: Discount;
};

export type Discount = {
  value: number;
  valueType: "percentage" | "fixed_amount";
  title: string;
};

export type Variant = {
  id: string;
  price: string;
  displayName: string;
  title: string;
  availableForSale: boolean;
  inventoryQuantity: number;
  image: VariantImage | null;
};

type VariantImage = {
  altText: string | null;
  url: string;
};

export type AddVariantChange = {
  type: "add_variant";
  variantId: number;
  quantity: number;
  discount?: Discount;
};

export interface CalculatedPurchase {
  /** Updated total price of the purchase with discounts but before shipping, taxes, and tips. */
  subtotalPriceSet: MoneyBag;
  /** Updated final price of the purchase. */
  totalPriceSet: MoneyBag;
  /** Array of `AddedTaxLine`. */
  addedTaxLines: AddedTaxLine[];
  /** Array of `UpdatedLineItem`. */
  updatedLineItems: UpdatedLineItem[];
  /** Array of `AddedShippingLine`. */
  addedShippingLines: AddedShippingLine[];
  /** The amount left unpaid after the update. */
  totalOutstandingSet: MoneyBag;
}

interface MoneyBag {
  /** Amount in shop currency. */
  shopMoney: Money;
  /** Amount in presentment currency. */
  presentmentMoney: Money;
}

interface Money {
  /** The actual amount. */
  amount: string;
  /** In ISO 4217 format. */
  currencyCode: string;
}

interface AddedTaxLine {
  /** The tax amount. */
  priceSet: MoneyBag;
  /** The tax rate to be applied. */
  rate: number;
  /** The name of the tax. */
  title: string;
}

interface UpdatedLineItem {
  /** The discounted total price. */
  totalPriceSet: MoneyBag;
  /** The price per quantity */
  priceSet: MoneyBag;
  /** The product ID. */
  productId: number;
  /** The variant ID. */
  variantId: number;
  /** The selling plan ID. */
  sellingPlanId?: number;
  /** The product slug in kebab-case. */
  productHandle: string;
  /** How many items are being purchased in this line.*/
  quantity: number;
}

interface AddedShippingLine {
  /** The shipping line price.*/
  priceSet: MoneyBag;
  /** The customer facing line title.*/
  presentmentTitle: string;
}
