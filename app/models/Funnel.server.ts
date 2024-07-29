import db from "../db.server";

import type { Variant } from "@/types/offer.type";
import type { Funnel, FunnelFormFields } from "@/types/models.type";

export async function getFunnel(id: number, graphql: Function) {
  const funnel = await db.funnel.findFirst({ where: { id } });

  if (!funnel) {
    return null;
  }

  return supplementFunnel(funnel, graphql);
}

export async function getAllFunnelsTriggerProductsIds() {
  const funnels = await db.funnel.findMany({
    select: {
      triggerProductId: true,
    },
  });

  if (!funnels) {
    return [];
  }

  return funnels?.map((funnel) => {
    const id = funnel.triggerProductId.split("/")[4];
    return id;
  });
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

  if (total === 0) {
    return {
      data: [],
      total,
      page,
      limit,
    };
  }

  const currentPage = page * limit > total ? Math.ceil(total / limit) : page;

  const funnels = await db.funnel.findMany({
    where: { shop },
    orderBy: { updatedAt: "desc" },
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

export async function getFunnelInfo(id: number) {
  const funnel = await db.funnel.findFirst({ where: { id } });

  if (!funnel) {
    return null;
  }

  return funnel;
}

export async function getFunnelByTriggerProductId(
  triggerProductId: string,
  shop: string,
  accessToken: string,
) {
  const funnel = await db.funnel.findFirst({
    where: { triggerProductId, shop },
  });

  if (!funnel) {
    return null;
  }

  return supplementPostPurchaseFunnel(funnel, accessToken);
}

export async function getOffer(
  triggerProductsIds: string[],
  shop: string,
  accessToken: string,
) {
  const funnels = await db.funnel.findMany({
    where: { triggerProductId: { in: triggerProductsIds }, shop },
    orderBy: { offerProductPrice: "desc" },
  });

  if (funnels.length > 0) {
    return supplementPostPurchaseFunnel(funnels[0], accessToken);
  } else {
    return [];
  }
}

async function supplementFunnel(funnel: Funnel, graphql: Function) {
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
    triggerProductTitle: data.triggerProduct.title,
    triggerProductImage: data.triggerProduct.images.nodes[0]?.url,
    offerProductTitle: data.offerProduct.title,
    offerProductId: data.offerProduct.id,
    offerProductPrice: Number(data.offerProduct.price.nodes[0]?.price),
    offerProductImage: data.offerProduct.images.nodes[0]?.url,
  };
}

export function validateFunnel(data: FunnelFormFields) {
  const errors = {} as Partial<FunnelFormFields>;

  if (!data.title) {
    errors.title = "Name is required";
  }

  if (!data.triggerProductId) {
    errors.triggerProductId = "Trigger product is required";
  }

  if (!data.offerProductId) {
    errors.offerProductId = "Offer product is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}

async function supplementPostPurchaseFunnel(
  { id, discount, offerProductId }: Funnel,
  accessToken: string,
) {
  async function fetchGraphQL(
    query: string,
    variables: Record<string, string>,
  ) {
    const response = await fetch(
      "https://niko-wonderwork.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query, variables }), // Изменено здесь
      },
    );
    return response.json();
  }

  const query = `query GetOfferProduct($productId: ID!) {
      product: product(id: $productId) {
        id
        title
        variants: variants(first: 100) {
          nodes {
            price
            id
            displayName
            image {
              height
              width
              altText
              url
            }
            title
            availableForSale
            inventoryQuantity
          }
        }
        description(truncateAt: 200)
        legacyResourceId
        featuredImage {
          url
        }
      }
    }
  `;

  const response = await fetchGraphQL(query, {
    productId: offerProductId,
  });

  const {
    data: { product },
  } = response;

  const variantId = product.variants.nodes[0].id.split("/")[4];

  return {
    id,
    productTitle: product.title,
    discount,
    variants: product.variants.nodes.map((variant: Variant) => ({
      ...variant,
      id: variant.id.split("/")[4],
    })),
    changes: [
      {
        type: "add_variant",
        variantId: variantId,
        quantity: 1,
        discount: {
          value: discount,
          valueType: "percentage",
          title: `${discount}% off`,
        },
      },
    ],
  };
}
