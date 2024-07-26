import type { CSSProperties } from "react";
import type { FunnelExtendedByProducts } from "./models.type";
import type { StatisticData } from "./data.type";
import type { NavigateFunction } from "@remix-run/react";

export interface EmptyActionStateProps {
  onAction: () => void;
}

export type VoidFunction = () => void;

export interface ActivatorProps {
  isExpanded: boolean;
  toggleActive: VoidFunction;
}

export interface DropdownProps {
  activeId: number;
  id: number;
  toggleActive: (id: number) => void;
  navigate: NavigateFunction;
}

export interface InfoTooltipProps {
  content: string;
  style?: CSSProperties;
}

export interface ModalProps {
  funnels: FunnelExtendedByProducts[];
  activeId: number;
}

type Variant = "small" | "base" | "large" | "max";

export interface UIModalElement
  extends Omit<HTMLElement, "addEventListener" | "removeEventListener"> {
  variant: Variant;
  content?: HTMLElement;
  src?: string;
  readonly contentWindow?: Window | null;
  show(): Promise<void>;
  hide(): Promise<void>;
  toggle(): Promise<void>;
  addEventListener(
    type: "show" | "hide",
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: "show" | "hide",
    listener: EventListenerOrEventListenerObject,
  ): void;
}

export interface MainPageLoaderProps {
  funnels: FunnelExtendedByProducts[];
  limit: number;
  page: number;
  stats: StatisticData;
  total: number;
}

export interface DataPikerRange {
  start: Date;
  end: Date;
}

interface NewFunnelPageLoaderProps {
  destination: string;
  title: string;
  triggeredIds: string[];
}

interface BasicFunnelPageLoaderProps extends FunnelExtendedByProducts {
  triggeredIds: string[];
}

export type FunnelPageLoaderProps =
  | NewFunnelPageLoaderProps
  | BasicFunnelPageLoaderProps;
