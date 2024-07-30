import { json } from "@remix-run/node";
import {
  useActionData,
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
  InlineError,
  Layout,
  Page,
  PageActions,
  Text,
  TextField,
  Thumbnail,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import db from "~/db.server";
import {
  getAllFunnelsTriggerProductsIds,
  getFunnel,
  validateFunnel,
} from "~/models/Funnel.server";
import { authenticate } from "~/shopify.server";
import { useCallback, useEffect, useState } from "react";

import type { FunnelPageLoaderProps } from "@/types/components.type";
import type { FunnelFormData } from "@/types/data.type";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const {
    admin,
    redirect,
    session: { shop },
  } = await authenticate.admin(request);

  /**
   * Get a list of all id products that are target in the Funnels List.
   * This is necessary to ensure that when creating or editing a Funnel these products do not appear in the target list.
   * This way we avoid situations where one product can be targeted in several funnels at the same time
   */
  const triggeredIds = await getAllFunnelsTriggerProductsIds();

  /**
   * If params id is "new" it is mean creation of new funnel.
   */

  if (params.id === "new") {
    return json({
      title: "",
      triggerProductId: "",
      offerProductId: "",
      offerProductPrice: 0,
      discount: 0,
      shop,
      triggeredIds,
    });
  }

  /**
   * If funnel exists, we're fulfilling form by its data.
   * If funnel not exists make redirect to funnel creation page
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

  /**
   * Get data from the form and validate it.
   * Transform numeric values from string to number in fields discount and offerProductPrice
   */
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  } as FunnelFormData;

  data.discount = Number(data.discount);
  data.offerProductPrice = Number(data.offerProductPrice);

  const errors = validateFunnel(data);

  if (errors) {
    return json({ errors }, { status: 422 });
  }

  /**
   * If params id is "new" it is mean creation of new funnel.
   * If funnel exists, we update it.
   */

  const funnel =
    params.id === "new"
      ? await db.funnel.create({ data })
      : await db.funnel.update({ where: { id: Number(params.id) }, data });

  /**
   * redirect needs for update form state.
   * For example, if we do not redirect after creation of new funnel,
   * secondary actions in PageAction block will be not accessible.
   */

  throw redirect(`/app/settings/${funnel.id}`);
}

export default function FunnelsForm() {
  /**
   * Fill in the form data from loader and make controlled input fields
   */
  const { triggeredIds, ...funnel } = useLoaderData() as FunnelPageLoaderProps;
  const [formState, setFormState] = useState(funnel);
  const [titleValue, setTitleValue] = useState(funnel.title || "");
  const [discountValue, setDiscountValue] = useState(
    funnel.discount.toString() || "",
  );

  /**
   * Get initial form state for control changes (!isDirty) and reset form (handleCancel)
   */
  const [cleanFormState, setCleanFormState] = useState(funnel);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  /**
   * Get errors from the server response if some fields are not valid
   */

  const errors = useActionData<typeof action>()?.errors || {};

  console.log("errors", errors);

  /**
   * Handle changes in the input fields.
   * Create debounced change of formState by input changes.
   */
  const handleTitleChange = useCallback(
    (newValue: string) => setTitleValue(newValue),
    [],
  );

  const handleDiscountChange = useCallback(
    (newValue: string) => setDiscountValue(newValue),
    [],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setFormState({
        ...formState,
        title: titleValue,
      });
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [formState, titleValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFormState({
        ...formState,
        discount: Number(discountValue),
      });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [discountValue, formState]);

  /**
   * Get loading state for additional advanced actions like disable buttons etc.
   */
  const navigate = useNavigate();
  const nav = useNavigation();
  const isLoading = nav.state === "submitting";

  /**
   *
   * @param idOfButton - id of the button that was clicked
   * Select product from the Shopify store functionality.
   * Depending on the idOfButton, the function selects the product for the offer or trigger.
   */
  async function selectProduct(
    idOfButton: "offer-product" | "trigger-product",
  ) {
    const isOfferProduct = idOfButton === "offer-product";

    /**
     * Open Shopify Resource Picker. Depending on the idOfButton,
     * the filter is set to exclude the products that are already in the funnel.
     */
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
            offerProductPrice: Number.isNaN(Number(price)) ? 0 : Number(price),
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

  /**
   *
   * @param idOfClearButton - id of the button that was clicked
   * Clear product data from the form.
   * Depending on the idOfClearButton, the function clears the product data for the offer or trigger.
   */
  function clearProductData(
    idOfClearButton: "clear-offer-product" | "clear-trigger-product",
  ) {
    const isOfferProduct = idOfClearButton === "clear-offer-product";

    isOfferProduct
      ? setFormState({
          ...formState,
          offerProductId: "",
          offerProductTitle: "",
          offerProductPrice: 0,
          offerProductImage: "",
        })
      : setFormState({
          ...formState,
          triggerProductId: "",
          triggerProductTitle: "",
          triggerProductImage: "",
        });
  }

  /**
   * Reset form state to initial state
   */
  const handleCancel = useCallback(() => {
    setFormState(cleanFormState);
    setTitleValue(cleanFormState.title);
    setDiscountValue(cleanFormState.discount.toString());
  }, [cleanFormState]);

  /**
   * Submit form data to the server.
   * First, we get the submit function from the useSubmit hook.
   * Then we create a data object with the necessary fields.
   * Fix new clean form state for the next form changes.
   * Finally, we submit the data to the server.
   */
  const submit = useSubmit();
  function handleSave() {
    const data = {
      title: formState.title,
      triggerProductId: formState.triggerProductId || "",
      offerProductId: formState.offerProductId || "",
      offerProductPrice: formState.offerProductPrice || 0,
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
                    <Text as="p" variant="bodyMd">
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
                      error={errors.title}
                    />
                  </Card>
                </Grid.Cell>
                {/* LABEL: TRIGGER block */}
                <Grid.Cell columnSpan={{ md: 2, lg: 2, xl: 2 }}>
                  <BlockStack gap="200">
                    <Text as="h2" fontWeight="medium" variant="headingLg">
                      Trigger
                    </Text>
                    <Text as="p" variant="bodyMd">
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
                          onClick={() =>
                            clearProductData("clear-trigger-product")
                          }
                          id="clear-trigger-product"
                          accessibilityLabel="Select Product"
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <>
                      <Card
                        background={
                          errors.triggerProductId
                            ? "bg-fill-critical-secondary"
                            : "bg-fill"
                        }
                      >
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
                            onClick={() => selectProduct("trigger-product")}
                            id="trigger-product"
                            accessibilityLabel="Select Product"
                          >
                            Select
                          </Button>
                        </div>
                      </Card>
                      {errors.triggerProductId && (
                        <InlineError
                          message={errors.triggerProductId}
                          fieldID="trigger-product"
                        />
                      )}
                    </>
                  )}
                </Grid.Cell>
                {/* LABEL: OFFER block */}
                <Grid.Cell columnSpan={{ md: 2, lg: 2, xl: 2 }}>
                  <BlockStack gap="200">
                    <Text as="h2" fontWeight="medium" variant="headingLg">
                      Offer
                    </Text>
                    <Text as="p" variant="bodyMd">
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
                          onClick={() =>
                            clearProductData("clear-offer-product")
                          }
                          id="clear-offer-product"
                          accessibilityLabel="Select Product"
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <>
                      <Card
                        background={
                          errors.offerProductId
                            ? "bg-fill-critical-secondary"
                            : "bg-fill"
                        }
                      >
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
                            onClick={() => selectProduct("offer-product")}
                            id="offer-product"
                            accessibilityLabel="Select Product"
                          >
                            Select
                          </Button>
                        </div>
                      </Card>
                      {errors.offerProductId && (
                        <InlineError
                          message={errors.offerProductId}
                          fieldID="offer-product"
                        />
                      )}
                    </>
                  )}
                </Grid.Cell>
                {/* LABEL: DISCOUNT block */}
                <Grid.Cell columnSpan={{ md: 2, lg: 2, xl: 2 }}>
                  <BlockStack gap="200">
                    <Text as="h2" fontWeight="medium" variant="headingLg">
                      Discount
                    </Text>
                    <Text as="p" variant="bodyMd">
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
                      align="left"
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
              loading: isLoading,
              disabled: !isDirty || isLoading,
              onAction: handleSave,
            }}
            secondaryActions={
              funnel.id
                ? [
                    {
                      content: "Create new funnel",
                      loading: isLoading,
                      disabled: isLoading,
                      onAction: () => navigate("/app/settings"),
                    },
                    {
                      content: "Cancel",
                      loading: isLoading,
                      disabled: !isDirty,
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
