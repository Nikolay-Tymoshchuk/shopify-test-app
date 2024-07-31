import db from "../db.server";

export const getSession = async (
  shop: string,
): Promise<Record<"accessToken", string> | null> => {
  return db.session.findFirst({
    where: {shop},
    select: {
      accessToken: true,
    },
  });
};
