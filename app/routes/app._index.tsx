import type { CSSProperties, FC } from "react";
import { useCallback, useState } from "react";

import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
// import { useFetcher } from "@remix-run/react";
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
  EmptyState,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { DeleteIcon, EditIcon, InfoIcon } from "@shopify/polaris-icons";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { getFunnels } from "~/models/Funnel.server";

interface EmptyQRCodeStateProps {
  onAction: () => void;
}

export const loader = async ({ request }: { request: LoaderFunctionArgs }) => {
  const { admin, session } = await authenticate.admin(request as any);
  const funnels = await getFunnels(session.shop, admin.graphql);

  return json({
    funnels,
  });
};

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

const EmptyQRCodeState: FC<EmptyQRCodeStateProps> = ({ onAction }) => (
  <EmptyState
    heading="Create funnel to start discount program"
    action={{
      content: "Create funnel",
      onAction,
    }}
    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
  >
    <p>You can start by clicking the button below.</p>
  </EmptyState>
);

export default function Index() {
  const { funnels } = useLoaderData() as any;
  const navigate = useNavigate();

  const [sortedRows, setSortedRows] = useState<TableData[][] | null>(null);
  const [activeId, setActiveId] = useState("");

  const toggleActive = useCallback(
    (id: string) => setActiveId(id === activeId ? "" : id),
    [activeId],
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
          sections={[
            {
              title: "File options",
              items: [
                { content: "Edit funnel", icon: EditIcon },
                {
                  destructive: true,
                  content: "Delete funnel",
                  icon: DeleteIcon,
                },
              ],
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

  return (
    <>
      {funnels.length === 0 ? (
        <EmptyQRCodeState onAction={() => navigate("settings/new")} />
      ) : (
        <>
          (
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
          )
        </>
      )}
    </>
  );
}
