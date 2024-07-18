import {
  Page,
  Card,
  Select,
  DatePicker,
  Button,
  Layout,
} from "@shopify/polaris";
import React, { useState, useCallback } from "react";

function BillingsPage() {
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });

  const [selectedOption, setSelectedOption] = useState("monthly");

  const handleDateRangeChange = useCallback(
    (value: any) => setSelectedDateRange(value),
    [],
  );
  const handleOptionChange = useCallback(
    (value: any) => setSelectedOption(value),
    [],
  );

  const options = [
    { label: "Monthly", value: "monthly" },
    { label: "Annually", value: "annually" },
    { label: "Weekly", value: "weekly" },
  ];

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
