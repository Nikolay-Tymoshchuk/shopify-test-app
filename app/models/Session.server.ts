import db from "../db.server";

export const getSession = async (shop: string) => {
  return await db.session.findFirst({
    where: { shop },
    select: {
      accessToken: true,
    },
  });
};
