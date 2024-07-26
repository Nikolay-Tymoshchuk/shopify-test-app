import db from "../db.server";

export const getSession = async (
  shop: string,
): Promise<Record<"accessToken", string> | null> => {
  return await db.session.findFirst({
    where: { shop },
    select: {
      accessToken: true,
    },
  });
};
