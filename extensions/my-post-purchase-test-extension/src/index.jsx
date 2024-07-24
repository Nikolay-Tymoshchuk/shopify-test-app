import {
  BlockStack,
  Button,
  CalloutBanner,
  extend,
  Heading,
  Image,
  Layout,
  render,
  Select,
  Separator,
  Text,
  TextField,
  TextBlock,
  TextContainer,
  Tiles,
  useExtensionInput,
  InlineStack,
  Bookend,
} from "@shopify/post-purchase-ui-extensions-react";
import { useEffect, useState, useMemo, useCallback } from "react";

// For local development, replace APP_URL with your local tunnel URL.
const APP_URL = "https://travels-eyes-nickname-poems.trycloudflare.com";

// Preload data from your app server to ensure that the extension loads quickly.
extend(
  "Checkout::PostPurchase::ShouldRender",
  async ({ inputData, storage }) => {
    const postPurchaseFunnel = await fetch(`${APP_URL}/api/offer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inputData.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        referenceId: inputData.initialPurchase.referenceId,
      }),
    }).then((response) => response.json());

    await storage.update(postPurchaseFunnel);

    return { render: true };
  },
);

render("Checkout::PostPurchase::Render", () => <App />);

export function App() {
  const { storage, inputData, calculateChangeset, applyChangeset, done } =
    useExtensionInput();
  const [loading, setLoading] = useState(true);
  const [calculatedPurchase, setCalculatedPurchase] = useState();

  const { offer: purchaseOption } = storage.initialData;

  const [options, setOptions] = useState({
    quantity: purchaseOption.changes[0]?.quantity || 1,
    variantId: purchaseOption.variants[0].id,
    variantTitle: purchaseOption.variants[0].title,
    imageSrc:
      purchaseOption.productImageUrl ||
      purchaseOption.variants[0].image.url ||
      "",
    altText: purchaseOption.variants[0].image.altText || "",
    maxQuantity: purchaseOption.variants[0].inventoryQuantity || undefined,
    mainTitle: purchaseOption.productTitle,
  });

  const handleSelectChange = useCallback(
    (value) => {
      const {
        id,
        title,
        image: { url, altText },
        displayName,
        inventoryQuantity,
      } = purchaseOption.variants.find((variant) => variant.id === value);

      setOptions({
        ...options,
        variantId: id,
        variantTitle: title,
        imageSrc: url,
        altText,
        mainTitle: displayName,
        maxQuantity: inventoryQuantity,
      });
    },
    [options, purchaseOption.variants],
  );

  const isMoreThenOneImgOption = useMemo(() => {
    const imageSetArray =
      purchaseOption.variants?.map(({ image: { url, altText } }) => ({
        url,
        altText,
      })) || [];
    const isNecessarySlider = imageSetArray.length > 1;
    const currentImageIndex = imageSetArray.findIndex(
      ({ url }) => url === options.imageSrc,
    );

    const changeImage = (direction) => {
      const newIndex =
        (currentImageIndex + direction + imageSetArray.length) %
        imageSetArray.length;
      const { url: newImageSrc } = imageSetArray[newIndex];
      const variantId = purchaseOption.variants.find(
        ({ image }) => image.url === newImageSrc,
      ).id;
      handleSelectChange(variantId);
    };

    const onNextImage = () => changeImage(1);
    const onPrevImage = () => changeImage(-1);

    const onImageClick = (imageSrc) => {
      const variantId = purchaseOption.variants.find(
        ({ image }) => image.url === imageSrc,
      ).id;
      handleSelectChange(variantId);
    };

    return {
      isNecessarySlider,
      onNextImage,
      onPrevImage,
      imageSetArray,
      onImageClick,
    };
  }, [handleSelectChange, options.imageSrc, purchaseOption.variants]);

  useEffect(() => {
    async function calculatePurchase() {
      const result = await calculateChangeset({
        changes: [
          {
            ...purchaseOption.changes[0],
            variantId: options.variantId,
            quantity: options.quantity,
          },
        ],
      });
      setCalculatedPurchase(result.calculatedPurchase);
      setLoading(false);
    }

    calculatePurchase();
  }, [calculateChangeset, purchaseOption.changes, options]);

  const shipping =
    calculatedPurchase?.addedShippingLines[0]?.priceSet?.presentmentMoney
      ?.amount;
  const taxes =
    calculatedPurchase?.addedTaxLines[0]?.priceSet?.presentmentMoney?.amount;
  const total = calculatedPurchase?.totalOutstandingSet.presentmentMoney.amount;
  const discountedPrice =
    calculatedPurchase?.updatedLineItems[0].totalPriceSet.presentmentMoney
      .amount;
  const originalPrice = (
    calculatedPurchase?.updatedLineItems[0].priceSet.presentmentMoney.amount *
    options.quantity
  ).toFixed(2);

  async function acceptOrder() {
    setLoading(true);

    // Make a request to your app server to sign the changeset with your app's API secret key.
    const token = await fetch(`${APP_URL}/api/sign-changeset`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inputData.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sub: inputData.initialPurchase.referenceId,
        changes: [
          {
            ...purchaseOption.changes[0],
            variantId: options.variantId,
            quantity: options.quantity,
          },
        ],
      }),
    })
      .then((response) => response.json())
      .then((response) => response.token)
      .catch((e) => console.log(e));

    await applyChangeset(token);

    const res = await fetch(`${APP_URL}/api/statistic-update`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${inputData.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        funnelId: purchaseOption.id,
        revenue: Number(total),
        discount: parseFloat((originalPrice - total).toFixed(2)),
      }),
    }).then((response) => response.json());

    console.log("res", res);

    done();
  }

  function declineOrder() {
    setLoading(true);
    // Redirect to the thank-you page
    done();
  }

  const handleQuantityChange = (value) => {
    setOptions({ ...options, quantity: Number(value) });
  };

  return (
    <BlockStack spacing="loose">
      <CalloutBanner background="transparent" border="none" spacing="loose">
        <BlockStack spacing="loose">
          <TextContainer>
            <Text size="xlarge" emphasized>
              {`We have offer for you with ${purchaseOption.discount}% discount`}
            </Text>
          </TextContainer>
        </BlockStack>
      </CalloutBanner>
      <Layout
        media={[
          { viewportSize: "small", sizes: [1, 0, 1], maxInlineSize: 0.9 },
          { viewportSize: "medium", sizes: [532, 0, 1], maxInlineSize: 420 },
          { viewportSize: "large", sizes: [560, 38, 340] },
        ]}
      >
        <BlockStack>
          <Image description="product photo" source={options.imageSrc} />
          {isMoreThenOneImgOption.isNecessarySlider && (
            <InlineStack>
              <Button onPress={isMoreThenOneImgOption.onPrevImage} plain>
                ⟨
              </Button>
              {isMoreThenOneImgOption.imageSetArray.map((image) => (
                <Button
                  onPress={() => isMoreThenOneImgOption.onImageClick(image.url)}
                  plain
                  key={image.url}
                >
                  <Image
                    description={image.altText || "product photo"}
                    source={image.url}
                    bordered={options.imageSrc === image.url}
                  />
                </Button>
              ))}
              <Button onPress={isMoreThenOneImgOption.onNextImage} plain>
                ⟩
              </Button>
            </InlineStack>
          )}
        </BlockStack>
        <BlockStack />
        <BlockStack>
          <Heading level={2}>{options.mainTitle}</Heading>
          <PriceHeader
            discountedPrice={discountedPrice}
            originalPrice={originalPrice}
            loading={!calculatedPurchase}
          />
          <Bookend leading alignment="leading" spacing="tight">
            <TextField
              label="Quantity"
              type="number"
              value={options.quantity}
              onInput={handleQuantityChange}
              tooltip={{
                label: "Quantity",
                content: `You can
                purchase up to ${options.maxQuantity} of this item.`,
              }}
              error={
                options.quantity > options.maxQuantity
                  ? "Quantity exceeds available stock"
                  : options.quantity < 1
                    ? "Quantity must be at least 1"
                    : undefined
              }
            />
            <Select
              label="Variant"
              value={options.variantId}
              onChange={handleSelectChange}
              options={purchaseOption.variants.map((variant) => ({
                value: variant.id,
                label: variant.title,
              }))}
            />
          </Bookend>
          <BlockStack spacing="xtight">
            <TextBlock subdued>{purchaseOption.description}</TextBlock>
          </BlockStack>
          <BlockStack spacing="tight">
            <Separator />
            <MoneyLine
              label="Subtotal"
              amount={discountedPrice}
              loading={!calculatedPurchase}
            />
            <MoneyLine
              label="Shipping"
              amount={shipping}
              loading={!calculatedPurchase}
            />
            <MoneyLine
              label="Taxes"
              amount={taxes}
              loading={!calculatedPurchase}
            />
            <Separator />
            <MoneySummary label="Total" amount={total} />
          </BlockStack>
          <BlockStack>
            <Button onPress={acceptOrder} submit loading={loading}>
              Pay now · {formatCurrency(total)}
            </Button>
            <Button onPress={declineOrder} subdued loading={loading}>
              Decline this offer
            </Button>
          </BlockStack>
        </BlockStack>
      </Layout>
    </BlockStack>
  );
}

function PriceHeader({ discountedPrice, originalPrice, loading }) {
  return (
    <TextContainer alignment="leading" spacing="loose">
      <Text role="deletion" size="large">
        {!loading && formatCurrency(originalPrice)}
      </Text>
      <Text emphasized size="large" appearance="critical">
        {" "}
        {!loading && formatCurrency(discountedPrice)}
      </Text>
    </TextContainer>
  );
}

function MoneyLine({ label, amount, loading = false }) {
  return (
    <Tiles>
      <TextBlock size="small">{label}</TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="small">
          {loading ? "-" : formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function MoneySummary({ label, amount }) {
  return (
    <Tiles>
      <TextBlock size="medium" emphasized>
        {label}
      </TextBlock>
      <TextContainer alignment="trailing">
        <TextBlock emphasized size="medium">
          {formatCurrency(amount)}
        </TextBlock>
      </TextContainer>
    </Tiles>
  );
}

function formatCurrency(amount) {
  if (!amount || parseInt(amount, 10) === 0) {
    return "Free";
  }
  return `$${amount}`;
}
