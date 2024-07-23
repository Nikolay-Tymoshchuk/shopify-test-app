import type { CSSProperties, FC } from "react";
import { useCallback, useEffect, useState } from "react";

import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
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
  Spinner,
  Pagination,
  Select,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { DeleteIcon, EditIcon, InfoIcon } from "@shopify/polaris-icons";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { getFunnels } from "../models/Funnel.server";
import db from "../db.server";

interface EmptyQRCodeStateProps {
  onAction: () => void;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 5;

  const { admin, session } = await authenticate.admin(request as any);
  const {
    data: funnels,
    total,
    page: currentPage,
  } = await getFunnels(session.shop, admin.graphql, page, limit);

  // Check if the current page is different from the requested page
  if (currentPage !== page) {
    url.searchParams.set("page", String(currentPage));
    return redirect(url.toString());
  }

  return json({
    funnels,
    page: currentPage,
    limit,
    total,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  await db.funnel.delete({
    where: { id: Number(formData.get("id")) },
  });

  redirect("/app");

  return json({ success: true });
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

function MyModal({ funnels, activeId }) {
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.data?.success) {
      const modalElement = document.getElementById("my-modal") as any;
      if (modalElement) {
        modalElement.hide();
      }
    }
  }, [fetcher.data]);

  return (
    <ui-modal id="my-modal">
      <Box paddingBlock="1000" paddingInlineStart="400">
        {activeId && fetcher.state === "idle" ? (
          <Text as="p" variant="bodyLg">
            Are you sure you want to delete{" "}
            <b>{`${funnels?.find((funnel: any) => funnel.id === activeId)?.title}`}</b>
          </Text>
        ) : (
          <Spinner accessibilityLabel="Spinner example" size="small" />
        )}
      </Box>
      <ui-title-bar title={"Delete funnel"}>
        <button
          variant="primary"
          tone="critical"
          onClick={() => {
            fetcher.submit(
              { action: "delete", id: activeId },
              { method: "post" },
            );
          }}
        >
          Delete
        </button>
        <button onClick={() => document.getElementById("my-modal")?.hide()}>
          Cancel
        </button>
      </ui-title-bar>
    </ui-modal>
  );
}

export default function Index() {
  const { funnels, total, page, limit } = useLoaderData() as any;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleNext = () => {
    searchParams.set("page", String(page + 1));
    setSearchParams(searchParams, {
      replace: true,
      preventScrollReset: true,
    });
  };

  const handlePrevious = () => {
    // Обновите параметры поиска, используя setSearchParams
    searchParams.set("page", String(page - 1));
    setSearchParams(searchParams, {
      replace: true,
      preventScrollReset: true,
    });
  };

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

  const Drop = ({ id }: { id: string }) => {
    return (
      <Popover
        active={activeId === id}
        activator={activator(id)}
        autofocusTarget="first-node"
        onClose={() => toggleActive(id)}
        key={id}
        preferredAlignment="left"
      >
        <ActionList
          actionRole="menuitem"
          sections={[
            {
              title: "File options",
              items: [
                {
                  content: "Edit funnel",
                  icon: EditIcon,
                  onAction: () => {
                    console.log("id", id);
                    navigate(`settings/${id}`);
                  },
                },
                {
                  destructive: true,
                  content: "Delete funnel",
                  icon: DeleteIcon,
                  onAction: () => {
                    document.getElementById("my-modal").show();
                  },
                },
              ],
            },
          ]}
        />
      </Popover>
    );
  };

  const initiallySortedRows: TableData[][] = funnels.map((funnel: any) => [
    funnel.title,
    funnel.triggerProductTitle,
    funnel.offerProductTitle,
    funnel.discount,
    <Drop id={funnel.id} key={funnel.id + funnel.name} />,
  ]);

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
            secondaryActions={
              <Button onClick={() => navigate("settings/new")}>
                Create a new funnel
              </Button>
            }
          >
            <BlockStack gap="800">
              <Divider borderColor="border" borderWidth="025" />
              <div>
                <DataTable
                  columnContentTypes={["text", "text", "text", "numeric"]}
                  headings={["Funnel name", "Trigger", "Offer", "Discount", ""]}
                  rows={rows}
                  sortable={[true, true, true, true, false]}
                  // pagination={{
                  //   hasNext: page * limit < total,
                  //   hasPrevious: page > 1,
                  //   onPrevious: () => handlePrevious(),
                  //   onNext: () => handleNext(),
                  //   nextKeys: [39],
                  //   previousKeys: [37],
                  //   label: `Showing ${page * limit - limit + 1} to ${
                  //     page * limit
                  //   } of ${total} funnels`,
                  // }}
                  defaultSortDirection="descending"
                  initialSortColumnIndex={0}
                  onSort={handleSort}
                  hoverable
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "end",
                    marginTop: "12px",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <Select
                    label="Items per page"
                    labelInline
                    options={[
                      { label: "2", value: "2" },
                      { label: "5", value: "5" },
                      { label: "10", value: "10" },
                    ]}
                    value={String(limit)}
                    onChange={(value) => {
                      searchParams.set("limit", value);
                      searchParams.set("page", "1");
                      setSearchParams(searchParams, {
                        replace: true,
                        preventScrollReset: true,
                      });
                    }}
                  />
                  <Pagination
                    hasNext={page * limit < total}
                    hasPrevious={page > 1}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    nextKeys={[39]}
                    previousKeys={[37]}
                    // label={`Showing ${funnels?.length} of ${total} funnels`}
                    label={`Showing ${page * limit - limit + 1} to ${page * limit < total ? page * limit : total} of ${total} funnels`}
                  />
                </div>
              </div>
            </BlockStack>
          </Page>
          {/* <ui-modal id="my-modal">
            <Box paddingBlock="1000" paddingInlineStart="400">
              <Text as="p" variant="bodyLg">
                Are you sure you want to delete{" "}
                <b>{`${funnels?.find((funnel: any) => funnel.id === activeId)?.title}`}</b>
              </Text>
            </Box>
            <ui-title-bar title={"Delete funnel"}>
              <button
                variant="primary"
                tone="critical"
                onClick={() => {
                  submit(
                    { action: "delete", id: activeId },
                    { method: "post" },
                  );
                }}
              >
                Delete
              </button>
              <button
                onClick={() => document.getElementById("my-modal").hide()}
              >
                Cancel
              </button>
            </ui-title-bar>
          </ui-modal> */}
          <MyModal funnels={funnels} activeId={activeId} />
        </>
      )}
    </>
  );
}
