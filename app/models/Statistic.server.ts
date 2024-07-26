import db from "../db.server";

export async function getTotalStats(shop: string) {
  const response = await db.statistic.findMany({
    where: { shop },
  });

  const emptyResponse = {
    totalOrders: 0,
    totalRevenue: 0,
    totalDiscount: 0,
  };

  if (!response) {
    return emptyResponse;
  }

  const result = response.reduce((acc, curr) => {
    acc.totalOrders += 1;
    acc.totalRevenue += curr.revenue;
    acc.totalDiscount += curr.discount;

    return acc;
  }, emptyResponse);

  return result;
}

export async function addOneToStatistic(data: any) {
  const response = await db.statistic.create({
    data,
  });

  return response;
}
