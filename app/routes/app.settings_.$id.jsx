import { useState, useCallback, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import {
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
  useNavigate,
} from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Card,
  Bleed,
  Button,
  ChoiceList,
  Divider,
  EmptyState,
  InlineStack,
  InlineError,
  Layout,
  Page,
  Text,
  TextField,
  Thumbnail,
  BlockStack,
  PageActions,
  LegacyStack,
  FormLayout,
  Box,
  InlineGrid,
  Grid,
  Select,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";

import db from "../db.server";
import { getFunnel, validateFunnel } from "../models/Funnel.server";

export async function loader({ request, params }) {
  const { admin } = await authenticate.admin(request);

  if (params.id === "new") {
    return json({
      destination: "product",
      title: "",
    });
  }

  return json(await getFunnel(Number(params.id), admin.graphql));
}

export async function action({ request, params }) {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  if (data.action === "delete") {
    await db.funnel.delete({ where: { id: Number(params.id) } });
    return redirect("/app");
  }

  const errors = validateFunnel(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  const funnel =
    params.id === "new"
      ? await db.funnel.create({ data })
      : await db.funnel.update({ where: { id: Number(params.id) }, data });

  return redirect(`/app/qrcodes/${funnel.id}`);
}

export default function QRCodeForm() {
  const errors = useActionData()?.errors || {};
  const [titleValue, setTitleValue] = useState("");
  const [discountValue, setDiscountValue] = useState(0);

  const handleTitleChange = useCallback(
    (newValue) => setTitleValue(newValue),
    [],
  );

  const handleDiscountChange = useCallback(
    (newValue) => setDiscountValue(newValue),
    [],
  );

  const funnel = useLoaderData();
  const [formState, setFormState] = useState(funnel);
  const [cleanFormState, setCleanFormState] = useState(funnel);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "delete";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  const navigate = useNavigate();

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

  async function selectProduct(e) {
    const isOfferProduct = e.target.closest("button").id === "offer-product";

    const products = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: false,
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
            triggerProductPrice: price,
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
          triggerProductPrice: "",
          triggerProductImage: "",
        });
  }

  const submit = useSubmit();
  function handleSave() {
    const data = {
      title: formState.title,
      productId: formState.productId || "",
      productVariantId: formState.productVariantId || "",
      productHandle: formState.productHandle || "",
      destination: formState.destination,
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
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
