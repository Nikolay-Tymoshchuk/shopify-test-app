export type FunnelBasic = {
  title: string;
  shop: string;
  triggerProductId: string;
  offerProductId: string;
  offerProductPrice: number;
  discount: number;
};

export type Funnel = FunnelBasic & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

export type FunnelExtendedByProducts = Funnel & {
  triggerProductTitle: string;
  triggerProductImage?: string | null;
  offerProductTitle: string;
  offerProductImage?: string | null;
};
