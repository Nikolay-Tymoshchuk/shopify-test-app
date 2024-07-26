import {
  Button,
  Card,
  DatePicker,
  Layout,
  Page,
  Select,
} from "@shopify/polaris";
import { useCallback, useState } from "react";

import type { DataPikerRange } from "@/types/components.type";

/**
 * This is silly page which deals nothing
 */
function BillingsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState<DataPikerRange>({
    start: new Date(),
    end: new Date(),
  });

  const handleDateRangeChange = useCallback(
    (value: DataPikerRange) => setSelectedDateRange(value),
    [],
  );

  const [selectedOption, setSelectedOption] = useState("monthly");
  const options = [
    { label: "Monthly", value: "monthly" },
    { label: "Annually", value: "annually" },
    { label: "Weekly", value: "weekly" },
  ];

  const handleOptionChange = useCallback(
    (value: "monthly" | "annually" | "weekly") => setSelectedOption(value),
    [],
  );

  return (
    <Page title="Billings">
      <Layout>
        <Layout.Section>
          <Card>
            <DatePicker
              month={selectedDateRange.start.getMonth()}
              year={selectedDateRange.start.getFullYear()}
              onMonthChange={(month, year) => {}}
              onChange={handleDateRangeChange}
              selected={selectedDateRange}
            />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Select
              label="Billing Period"
              options={options}
              onChange={handleOptionChange}
              value={selectedOption}
            />
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <Button variant="primary">Submit</Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default BillingsPage;
