import type { FunnelBasic } from "./models.type";

export type StatisticData = {
  totalOrders: number;
  totalRevenue: number;
  totalDiscount: number;
};

export type FunnelFormData = FunnelBasic & {
  shop: string;
};
