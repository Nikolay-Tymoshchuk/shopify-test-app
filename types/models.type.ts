export type Funnel = FunnelBasic & {
  id: number;
};

export type FunnelModel = Funnel & {
  createdAt: string;
  updatedAt: string;
};

export type FunnelExtendedByProducts = Funnel & {
  triggerProductTitle: string;
  triggerProductImage?: string | null;
  offerProductTitle: string;
  offerProductImage?: string | null;
};

export type FunnelFormFields = {
  title: string;
  triggerProductId: string;
  offerProductId: string;
  discount: number;
};

export type FunnelBasic = FunnelFormFields & {
  shop: string;
  offerProductPrice: number;
};

export type Statistic = {
  id: number;
  shop: string;
  funnelId: number;
  revenue: number;
  discount: number;
};
