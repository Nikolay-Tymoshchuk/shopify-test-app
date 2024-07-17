import { CSSProperties, FC, useCallback, useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import type { TableData } from "@shopify/polaris";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  Icon,
  Grid,
  Tooltip,
  Divider,
  DataTable,
  Popover,
  ActionList,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { CaretDownIcon, CaretUpIcon, InfoIcon } from "@shopify/polaris-icons";
import sillyData from "@/data/sillyData.json";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];

  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        input: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const variantId =
    responseJson.data!.productCreate!.product!.variants.edges[0]!.node!.id!;
  const variantResponse = await admin.graphql(
    `#graphql
      mutation shopifyRemixTemplateUpdateVariant($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            price
            barcode
            createdAt
          }
        }
      }`,
    {
      variables: {
        input: {
          id: variantId,
          price: Math.random() * 100,
        },
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return json({
    product: responseJson!.data!.productCreate!.product,
    variant: variantResponseJson!.data!.productVariantUpdate!.productVariant,
  });
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const [sortedRows, setSortedRows] = useState<TableData[][] | null>(null);
  const [activeId, setActiveId] = useState("");

  const toggleActive = useCallback(
    (id: string) => setActiveId(id === activeId ? "" : id),
    [activeId],
  );

  const handleImportedAction = useCallback(
    () => console.log("Imported action"),
    [],
  );

  const handleExportedAction = useCallback(
    () => console.log("Exported action"),
    [],
  );

  const activator = (id: string) => {
    const expanded = activeId === id;
    return (
      <div
        style={{
          maxWidth: "fit-content",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <Button
          onClick={() => toggleActive(id)}
          variant="plain"
          disclosure={expanded ? "up" : "down"}
        >
          Actions
        </Button>
      </div>
    );
  };

  // const initiallySortedRows: TableData[][] = sillyData.map(
  //   ({ name, trigger, offer, discount, id }) => [
  //     name,
  //     trigger,
  //     offer,
  //     discount,
  //     <Popover
  //       active={activeId === id}
  //       activator={activator(id)}
  //       autofocusTarget="first-node"
  //       onClose={() => toggleActive(id)}
  //       key={id}
  //     >
  //       <ActionList
  //         actionRole="menuitem"
  //         items={[
  //           {
  //             content: "Rename",
  //             onAction: handleImportedAction,
  //           },
  //           {
  //             content: "Delete",
  //             onAction: handleExportedAction,
  //           },
  //         ]}
  //       />
  //     </Popover>,
  //   ],
  // );

  // console.log("incomingData", incomingData);

  const Drop = ({ id }: { id: string }) => {
    return (
      <Popover
        active={activeId === id}
        activator={activator(id)}
        autofocusTarget="first-node"
        onClose={() => toggleActive(id)}
        key={id}
        preferredAlignment="left"
        fullWidth
      >
        <ActionList
          actionRole="menuitem"
          items={[
            {
              content: "Rename",
              onAction: handleImportedAction,
            },
            {
              content: "Delete",
              onAction: handleExportedAction,
            },
          ]}
        />
      </Popover>
    );
  };

  const initiallySortedRows: TableData[][] = [
    [
      "First",
      "First trigger",
      "First offer",
      0,
      <Drop id="first" key="first" />,
    ],
    [
      "Second",
      "Second trigger",
      "Second offer",
      10,
      <Drop id="second" key="second" />,
    ],
    [
      "Third",
      "Third trigger",
      "Third offer",
      20,
      <Drop id="third" key="third" />,
    ],
    [
      "Fourth",
      "Fourth trigger",
      "Fourth offer",
      30,
      <Drop id="fourth" key="fourth" />,
    ],
    [
      "Fifth",
      "Fifth trigger",
      "Fifth offer",
      40,
      <Drop id="fifth" key="fifth" />,
    ],
  ];

  function sortCurrency(
    rows: TableData[][],
    index: number,
    direction: "ascending" | "descending",
  ): TableData[][] {
    return [...rows].sort((rowA, rowB) => {
      const valueA = rowA[index];
      const valueB = rowB[index];

      if (typeof valueA === "string" && typeof valueB === "string") {
        return direction === "descending"
          ? valueB.localeCompare(valueA)
          : valueA.localeCompare(valueB);
      } else if (typeof valueA === "number" && typeof valueB === "number") {
        return direction === "descending" ? valueB - valueA : valueA - valueB;
      } else {
        return 0;
      }
    });
  }

  const rows = sortedRows ? sortedRows : initiallySortedRows;

  const handleSort = useCallback(
    (index: number, direction: "ascending" | "descending") =>
      setSortedRows(sortCurrency(rows, index, direction)),
    [rows],
  );

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <>
      <Page
        title="Dashboard"
        titleMetadata={
          <InfoTooltip content="Here you can view your store's performance" />
        }
      >
        <BlockStack gap="800">
          <Divider borderColor="border" borderWidth="025" />
          <Layout>
            <Layout.Section>
              <Grid columns={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 3 }}>
                <Grid.Cell>
                  <Card roundedAbove="sm">
                    <Text as="h2" fontWeight="medium" variant="headingSm">
                      Total Revenue
                    </Text>

                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodyLg" fontWeight="bold">
                        $4.28
                      </Text>
                    </Box>
                  </Card>
                </Grid.Cell>
                <Grid.Cell>
                  <Card roundedAbove="sm">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text as="h2" fontWeight="medium" variant="headingSm">
                        Total Discounts
                      </Text>
                      <InfoTooltip content={"Total discounts applied"} />
                    </div>

                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodyLg" fontWeight="bold">
                        $2.28
                      </Text>
                    </Box>
                  </Card>
                </Grid.Cell>
                <Grid.Cell>
                  <Card roundedAbove="sm">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text as="h2" fontWeight="medium" variant="headingSm">
                        Order Count
                      </Text>
                      <InfoTooltip content={"Total number of orders"} />
                    </div>

                    <Box paddingBlockStart="200">
                      <Text as="p" variant="bodyLg" fontWeight="bold">
                        3
                      </Text>
                    </Box>
                  </Card>
                </Grid.Cell>
              </Grid>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
      <Page
        title="Funnels"
        titleMetadata={
          <InfoTooltip content="Here you can manipulate with your funnels" />
        }
        secondaryActions={<Button>Create a new funnel</Button>}
      >
        <BlockStack gap="800">
          <Divider borderColor="border" borderWidth="025" />
          <DataTable
            columnContentTypes={["text", "text", "text", "numeric"]}
            headings={["Funnel name", "Trigger", "Offer", "Discount", ""]}
            rows={rows}
            sortable={[true, true, true, true, false]}
            pagination={{
              hasNext: true,
              onNext: () => {},
              nextKeys: [39],
              previousKeys: [37],
            }}
            defaultSortDirection="descending"
            initialSortColumnIndex={0}
            onSort={handleSort}
            hoverable
          />
        </BlockStack>
      </Page>
    </>
  );
}

const InfoTooltip: FC<{ content: string; style?: CSSProperties }> = ({
  content = "",
  style = {},
}) => {
  return (
    <div style={{ ...style }}>
      <Tooltip content={content}>
        <Icon source={InfoIcon} tone="base" />
      </Tooltip>
    </div>
  );
};
