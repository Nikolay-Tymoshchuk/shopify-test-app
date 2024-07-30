import {EmptyState} from "@shopify/polaris";
import {useNavigate} from "@remix-run/react";

import type {FC} from "react";

interface EmptyQRCodeStateProps {
  onAction: () => void;
}

const EmptyQRCodeState: FC<EmptyQRCodeStateProps> = ({onAction}) => (
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
  const navigate = useNavigate();

  return <EmptyQRCodeState onAction={() => navigate("new")}/>;
}
