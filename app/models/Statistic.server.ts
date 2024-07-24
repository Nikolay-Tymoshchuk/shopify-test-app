import db from "../db.server";

export async function getTotalStats(shop: string) {
  const response = await db.statistic.findMany({
    where: { shop },
  });

  if (!response) {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalDiscount: 0,
    };
  }

  const result = response.reduce(
    (acc, curr) => {
      acc.totalOrders += 1;
      acc.totalRevenue += curr.revenue;
      acc.totalDiscount += curr.discount;

      return acc;
    },
    {
      totalOrders: 0,
      totalRevenue: 0,
      totalDiscount: 0,
    },
  );

  return result;
}

export async function addOneToStatistic(data: any) {
  const response = await db.statistic.create({
    data,
  });

  return response;
}
