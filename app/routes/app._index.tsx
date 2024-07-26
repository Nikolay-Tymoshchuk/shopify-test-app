import { json, redirect } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react";
import type { TableData } from "@shopify/polaris";
import {
  ActionList,
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  Divider,
  EmptyState,
  Grid,
  Icon,
  Layout,
  Page,
  Pagination,
  Popover,
  Select,
  Spinner,
  Text,
  Tooltip,
} from "@shopify/polaris";
import { DeleteIcon, EditIcon, InfoIcon } from "@shopify/polaris-icons";
import { useCallback, useEffect, useState } from "react";

import db from "~/db.server";
import { getFunnels } from "~/models/Funnel.server";
import { getTotalStats } from "~/models/Statistic.server";
import { authenticate } from "~/shopify.server";

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { FC } from "react";
import type {
  ActivatorProps,
  DropdownProps,
  EmptyActionStateProps,
  InfoTooltipProps,
  MainPageLoaderProps,
  ModalProps,
  UIModalElement,
} from "@/types/components.type";
import type { StatisticData } from "@/types/data.type";
import type { FunnelExtendedByProducts } from "@/types/models.type";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  /**
   * Get List of funnels with pagination data
   */
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 5;

  const {
    data: funnels,
    total,
    page: currentPage,
  } = await getFunnels(session.shop, admin.graphql, page, limit);

  /**
   * From the server side we get also get page number.
   * This is necessary for the case when the user enters a page number greater than the total number of pages.
   * So we need to redirect user to the last page of the list
   * even if the user enters a page number greater than the total number of pages.
   */
  if (currentPage !== page) {
    url.searchParams.set("page", String(currentPage));
    return redirect(url.toString());
  }

  /**
   * Get statistic for analytic section from the database
   */

  const stats: StatisticData = await getTotalStats(session.shop);

  return json({
    funnels,
    page: currentPage,
    limit,
    total,
    stats,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  /**
   * Singe action on this page is to delete the funnel.
   * When complete, redirect to the main page.
   */

  await db.funnel.delete({
    where: { id: Number(formData.get("id")) },
  });

  redirect("/app");

  return json({ success: true });
};

/**
 * The main page of the application.
 */
export default function Index() {
  const { funnels, total, page, limit, stats } =
    useLoaderData() as MainPageLoaderProps;

  const navigate = useNavigate();

  /**
   * Pagination logic
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const handlePaginationClick = (page: number): void => {
    searchParams.set("page", page.toString());
    setSearchParams(searchParams, {
      replace: true,
      preventScrollReset: true,
    });
  };

  const onNext = () => handlePaginationClick(page + 1);
  const onPrevious = () => handlePaginationClick(page - 1);

  /**
   * Actions logic
   * When the user clicks on the actions button, the dropdown with the actions will be shown.
   * The dropdown contains two actions: Edit funnel and Delete funnel.
   */

  const [activeId, setActiveId] = useState<number>(-1);

  const handleToggleActive = useCallback(
    (id: number) => setActiveId(id === activeId ? -1 : id),
    [activeId],
  );

  /**
   * Table Sorting logic
   */

  const initiallySortedRows: TableData[][] = funnels.map(
    (funnel: FunnelExtendedByProducts) => [
      funnel.title,
      funnel.triggerProductTitle,
      funnel.offerProductTitle,
      funnel.discount,
      <Drop
        id={funnel.id}
        key={funnel.id + funnel.title}
        activeId={activeId}
        toggleActive={handleToggleActive}
        navigate={navigate}
      />,
    ],
  );

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
  const [sortedRows, setSortedRows] = useState<TableData[][] | null>(null);
  const rows = sortedRows ? sortedRows : initiallySortedRows;

  const handleSort = useCallback(
    (index: number, direction: "ascending" | "descending") =>
      setSortedRows(sortCurrency(rows, index, direction)),
    [rows],
  );

  return (
    <>
      {funnels.length ? (
        <>
          <Analytic {...stats} />
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
                    onPrevious={onPrevious}
                    onNext={onNext}
                    nextKeys={[39]}
                    previousKeys={[37]}
                    label={`Showing ${page * limit - limit + 1} to ${page * limit < total ? page * limit : total} of ${total} funnels`}
                  />
                </div>
              </div>
            </BlockStack>
          </Page>
          <Modal funnels={funnels} activeId={activeId} />
        </>
      ) : (
        <EmptyQRCodeState onAction={() => navigate("settings/new")} />
      )}
    </>
  );
}

const InfoTooltip: FC<InfoTooltipProps> = ({ content = "", style = {} }) => {
  return (
    <div style={{ ...style }}>
      <Tooltip content={content}>
        <Icon source={InfoIcon} tone="base" />
      </Tooltip>
    </div>
  );
};

const EmptyQRCodeState: FC<EmptyActionStateProps> = ({ onAction }) => (
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

const Modal: FC<ModalProps> = ({ funnels, activeId }) => {
  const fetcher = useFetcher();

  /**
   * Listen for the success of the deletion of the funnel.
   * If the deletion was successful, close the modal.
   */
  useEffect(() => {
    if ((fetcher.data as { success?: boolean })?.success) {
      const modalElement = document.getElementById("modal") as UIModalElement;
      if (modalElement) {
        modalElement.hide();
      }
    }
  }, [fetcher.data]);

  return (
    <ui-modal id="modal">
      <Box paddingBlock="1000" paddingInlineStart="400">
        {activeId && fetcher.state === "idle" ? (
          <Text as="p" variant="bodyLg">
            Are you sure you want to delete{" "}
            <b>{`${funnels?.find((funnel: FunnelExtendedByProducts) => funnel.id === activeId)?.title}`}</b>
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
        <button
          onClick={() => {
            const modalElement = document.getElementById(
              "modal",
            ) as UIModalElement;
            if (modalElement) {
              modalElement.hide();
            }
          }}
        >
          Cancel
        </button>
      </ui-title-bar>
    </ui-modal>
  );
};

const Analytic: FC<StatisticData> = ({
  totalRevenue,
  totalDiscount,
  totalOrders,
}) => {
  return (
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
                      {totalRevenue ? `$${totalRevenue.toFixed(2)}` : 0}
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
                      {totalDiscount ? `$${totalDiscount.toFixed(2)}` : 0}
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
                      {totalOrders}
                    </Text>
                  </Box>
                </Card>
              </Grid.Cell>
            </Grid>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
};

const Activator: FC<ActivatorProps> = ({ toggleActive, isExpanded }) => {
  return (
    <div
      style={{
        maxWidth: "fit-content",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Button
        onClick={toggleActive}
        variant="plain"
        disclosure={isExpanded ? "up" : "down"}
      >
        Actions
      </Button>
    </div>
  );
};

const Drop: FC<DropdownProps> = ({ id, activeId, toggleActive, navigate }) => {
  const isExpanded = activeId === id;

  return (
    <Popover
      active={isExpanded}
      activator={
        <Activator
          isExpanded={isExpanded}
          toggleActive={() => toggleActive(id)}
        />
      }
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
                  navigate(`settings/${id}`);
                },
              },
              {
                destructive: true,
                content: "Delete funnel",
                icon: DeleteIcon,
                onAction: () => {
                  const modalElement = document.getElementById(
                    "modal",
                  ) as UIModalElement;

                  if (modalElement) {
                    modalElement.show();
                  }
                },
              },
            ],
          },
        ]}
      />
    </Popover>
  );
};
