import { json } from "@remix-run/node";
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import {
  BlockStack,
  Button,
  Card,
  Divider,
  FormLayout,
  Grid,
  Layout,
  Page,
  PageActions,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useState } from "react";

import db from "../db.server";
import {
  getAllFunnelsTriggerProductsIds,
  getFunnel,
  validateFunnel,
} from "../models/Funnel.server";
import { authenticate } from "../shopify.server";

import type { FunnelPageLoaderProps } from "@/types/components.type";
import type { FunnelFormData } from "@/types/data.type";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin, redirect } = await authenticate.admin(request);

  /**
   * Get a list of all id products that are target in the Funnels List.
   * This is necessary to ensure that when creating or editing a Funnel these products do not appear in the target list.
   * This way we avoid situations where one product can be targeted in several funnels at the same time
   */
  const triggeredIds = await getAllFunnelsTriggerProductsIds();

  /**
   * If param.id is "new" it is mean creation of new funnel.
   */
  if (params.id === "new") {
    return json({
      destination: "funnel",
      title: "",
      triggeredIds,
    });
  }

  /**
   * If funnel exist we fulfilling form by it data.
   * If funnel not exist make redirect to to funnel creation page
   */
  const funnel = await getFunnel(Number(params.id), admin.graphql);

  return funnel
    ? json({
        ...funnel,
        triggeredIds,
      })
    : redirect("/app/settings/new");
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { session, redirect } = await authenticate.admin(request);
  const { shop } = session;

  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  } as FunnelFormData;

  if (data.triggerProductId === "") {
    delete data.triggerProductId;
  }

  data.discount = Number(data.discount);

  if (data.action === "delete") {
    await db.funnel.delete({ where: { id: Number(params.id) } });
    throw redirect("/app");
  }

  const errors = validateFunnel(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const funnel =
    params.id === "new"
      ? await db.funnel.create({ data })
      : await db.funnel.update({ where: { id: Number(params.id) }, data });

  throw redirect(`/app/settings/${funnel.id}`);
}

export default function FunnelsForm() {
  const { triggeredIds, ...funnel } = useLoaderData() as FunnelPageLoaderProps;
  const [titleValue, setTitleValue] = useState(funnel.title || "");
  const [discountValue, setDiscountValue] = useState(funnel.discount || 0);

  const handleTitleChange = useCallback(
    (newValue) => setTitleValue(newValue),
    [],
  );

  const handleDiscountChange = useCallback(
    (newValue) => setDiscountValue(newValue),
    [],
  );

  const [formState, setFormState] = useState(funnel);
  const [cleanFormState, setCleanFormState] = useState(funnel);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const navigate = useNavigate();
  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  useEffect(() => {
    const handler = setTimeout(() => {
      setFormState({
        ...formState,
        title: titleValue,
      });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [titleValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFormState({
        ...formState,
        discount: discountValue,
      });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [discountValue]);

  async function selectProduct(e) {
    const isOfferProduct = e.target.closest("button").id === "offer-product";

    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: false,
      filter: {
        query: isOfferProduct
          ? ""
          : `NOT id:${triggeredIds.join(" AND NOT id:")}`,
      },
    });

    if (products) {
      const {
        id,
        title,
        variants: [{ price }],
        images: [image],
      } = products[0];

      isOfferProduct
        ? setFormState({
            ...formState,
            offerProductId: id,
            offerProductTitle: title,
            offerProductPrice: price,
            offerProductImage: image.originalSrc,
          })
        : setFormState({
            ...formState,
            triggerProductId: id,
            triggerProductTitle: title,
            triggerProductImage: image.originalSrc,
          });
    }
  }

  function clearProductData(e) {
    const isOfferProduct =
      e.target.closest("button").id === "clear-offer-product";

    isOfferProduct
      ? setFormState({
          ...formState,
          offerProductId: "",
          offerProductTitle: "",
          offerProductPrice: "",
          offerProductImage: "",
        })
      : setFormState({
          ...formState,
          triggerProductId: "",
          triggerProductTitle: "",
          triggerProductImage: "",
        });
  }

  const submit = useSubmit();

  function handleRedirectToNew() {
    navigate("/app/settings");
  }

  const handleCancel = useCallback(() => {
    setFormState(cleanFormState);
    setTitleValue(cleanFormState.title);
    setDiscountValue(cleanFormState.discount);
  }, [cleanFormState]);

  function handleSave() {
    const data = {
      title: formState.title,
      triggerProductId: formState.triggerProductId || "",
      offerProductId: formState.offerProductId || "",
      offerProductPrice: formState.offerProductPrice || "",
      discount: formState.discount || 0,
    };

    setCleanFormState({ ...formState });
    submit(data, { method: "post" });
  }

  return (
    <Page title={funnel.id ? "Funnel Edit" : "Funnel Create"}>
      <Layout>
        <Layout.Section>
          <FormLayout>
            <BlockStack gap="1000">
              <Divider borderColor="border" borderWidth="025" />
              <Grid
                columns={{ xs: 1, sm: 1, md: 5, lg: 5, xl: 5 }}
                gap={{
                  xs: "16px",
                  sm: "16px",
                  md: "40px",
                  lg: "40px",
                  xl: "40px",
                }}
              >
                {/* LABEL: NAME block */}
                <Grid.Cell columnSpan={{ md: 2, lg: 2, xl: 2 }}>
                  <BlockStack gap="200">
                    <Text as="h2" fontWeight="medium" variant="headingLg">
                      Name
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="normal">
                      Self-explanatory title
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ md: 3, lg: 3, xl: 3 }}>
                  <Card>
                    <TextField
                      label="Funnel title"
                      value={titleValue}
                      onChange={handleTitleChange}
                      autoComplete="off"
                      fill
                    />
                  </Card>
                </Grid.Cell>
                {/* LABEL: TRIGGER block */}
                <Grid.Cell columnSpan={{ md: 2, lg: 2, xl: 2 }}>
                  <BlockStack gap="200">
                    <Text as="h2" fontWeight="medium" variant="headingLg">
                      Trigger
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="normal">
                      Choose trigger product
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ md: 3, lg: 3, xl: 3 }}>
                  {formState.triggerProductId ? (
                    <Card>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <Thumbnail
                            source={formState.triggerProductImage || ImageIcon}
                            alt={formState.triggerProductTitle}
                            size="extraSmall"
                          />
                          <Text as="h3" variant="headingSm">
                            {formState.triggerProductTitle}
                          </Text>
                        </div>
                        <Button
                          variant="primary"
                          tone="critical"
                          onClick={clearProductData}
                          id="clear-trigger-product"
                          accessibilityLabel="Select Product"
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text as="p">Please select trigger product</Text>
                        <Button
                          variant="primary"
                          tone="success"
                          onClick={selectProduct}
                          id="trigger-product"
                          accessibilityLabel="Select Product"
                        >
                          Select
                        </Button>
                      </div>
                    </Card>
                  )}
                </Grid.Cell>
                {/* LABEL: OFFER block */}
                <Grid.Cell columnSpan={{ md: 2, lg: 2, xl: 2 }}>
                  <BlockStack gap="200">
                    <Text as="h2" fontWeight="medium" variant="headingLg">
                      Offer
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="normal">
                      Choose offer product
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ md: 3, lg: 3, xl: 3 }}>
                  {formState.offerProductId ? (
                    <Card>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                          }}
                        >
                          <Thumbnail
                            source={formState.offerProductImage || ImageIcon}
                            alt={formState.offerProductTitle}
                            size="extraSmall"
                          />
                          <Text as="h3" variant="headingSm">
                            {formState.offerProductTitle}
                          </Text>
                        </div>
                        <Button
                          variant="primary"
                          tone="critical"
                          onClick={clearProductData}
                          id="clear-offer-product"
                          accessibilityLabel="Select Product"
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <Card>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Text as="p">Please select your offered product</Text>
                        <Button
                          variant="primary"
                          tone="success"
                          onClick={selectProduct}
                          id="offer-product"
                          accessibilityLabel="Select Product"
                        >
                          Select
                        </Button>
                      </div>
                    </Card>
                  )}
                </Grid.Cell>
                {/* LABEL: DISCOUNT block */}
                <Grid.Cell columnSpan={{ md: 2, lg: 2, xl: 2 }}>
                  <BlockStack gap="200">
                    <Text as="h2" fontWeight="medium" variant="headingLg">
                      Discount
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="normal">
                      Choose discount percentage
                    </Text>
                  </BlockStack>
                </Grid.Cell>
                <Grid.Cell columnSpan={{ md: 3, lg: 3, xl: 3 }}>
                  <Card>
                    <TextField
                      label="Select your discount"
                      type="number"
                      value={discountValue}
                      onChange={handleDiscountChange}
                      autoComplete="off"
                      min={0}
                      max={100}
                      autoSize
                      suffix="%"
                      align="start"
                    />
                  </Card>
                </Grid.Cell>
              </Grid>
              <Divider borderColor="border" borderWidth="025" />
            </BlockStack>
          </FormLayout>
        </Layout.Section>
        <Layout.Section>
          <PageActions
            primaryAction={{
              content: "Save",
              tone: "primary",
              loading: isSaving,
              disabled: !isDirty || isSaving || isDeleting,
              onAction: handleSave,
            }}
            secondaryActions={
              funnel.id
                ? [
                    {
                      content: "Create new funnel",
                      loading: isSaving,
                      disabled: isSaving || isDeleting,
                      onAction: handleRedirectToNew,
                    },
                    {
                      content: "Cancel",
                      tone: "secondary",
                      loading: isSaving,
                      disabled: isSaving || isDeleting,
                      onAction: handleCancel,
                    },
                  ]
                : undefined
            }
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
