import db from "../db.server";

interface Funnel {
  title: string;
  triggerProductTitle: string;
  offerProductTitle: string;
  discount: number;
}

// interface FunnelModel extends Funnel {
//   id: number;
//   shop: string;
//   triggerProductId: string;
//   triggerProductPrice: string;
//   offerProductId: string;
//   offerProductPrice: string;
//   createdAt: string;
//   updatedAt: string;
// }

export async function getFunnel(id: number, graphql: Function) {
  const funnel = await db.funnel.findFirst({ where: { id } });

  if (!funnel) {
    return null;
  }

  return supplementFunnel(funnel, graphql);
}

export async function getFunnels(
  shop: string,
  graphql: Function,
  page: number = 1,
  limit: number = 5,
) {
  const total = await db.funnel.count({
    where: { shop },
  });
  const currentPage = page * limit > total ? Math.ceil(total / limit) : page;

  const funnels = await db.funnel.findMany({
    where: { shop },
    orderBy: { id: "desc" },
    skip: (currentPage - 1) * limit,
    take: limit,
  });

  if (funnels.length === 0) {
    return {
      data: [],
      total,
      page: currentPage,
      limit,
    };
  }
  const data = await Promise.all(
    funnels.map((funnel) => supplementFunnel(funnel, graphql)),
  );

  return {
    data,
    total,
    page: currentPage,
    limit,
  };
}

async function supplementFunnel(funnel: any, graphql: any) {
  const response = await graphql(
    `
      query supplementFunnel($triggerProductId: ID!, $offerProductId: ID!) {
        triggerProduct: product(id: $triggerProductId) {
          id
          title
          price: variants(first: 1) {
            nodes {
              price
            }
          }
          images(first: 1) {
            nodes {
              url
            }
          }
        }
        offerProduct: product(id: $offerProductId) {
          id
          title
          price: variants(first: 1) {
            nodes {
              price
            }
          }
          images(first: 1) {
            nodes {
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        triggerProductId: funnel.triggerProductId,
        offerProductId: funnel.offerProductId,
      },
    },
  );

  const { data } = await response.json();

  return {
    ...funnel,
    triggerProductId: data.triggerProduct.id,
    triggerProductPrice: data.triggerProduct.price.nodes[0]?.price,
    triggerProductTitle: data.triggerProduct.title,
    triggerProductImage: data.triggerProduct.images.nodes[0]?.url,
    offerProductTitle: data.offerProduct.title,
    offerProductId: data.offerProduct.id,
    offerProductPrice: data.offerProduct.price.nodes[0]?.price,
    offerProductImage: data.offerProduct.images.nodes[0]?.url,
  };
}

export function validateFunnel(data: Funnel) {
  console.log("DATA", data);
  const errors = {} as Partial<Funnel>;

  if (!data.title) {
    errors.title = "Name is required";
  }

  if (!data.triggerProductTitle) {
    errors.triggerProductTitle = "Trigger is required";
  }

  if (!data.offerProductTitle) {
    errors.offerProductTitle = "Offer is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
