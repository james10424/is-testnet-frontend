import { ReactNode } from "react";
import { AtomBox, AtomBoxProps, SwapCSS } from "@pancakeswap/uikit";

import { SwapFooter } from "./Footer";
import styled from "styled-components";

type SwapPageProps = AtomBoxProps & {
  removePadding?: boolean;
  hideFooterOnDesktop?: boolean;
  noMinHeight?: boolean;
  helpUrl?: string;
  helpImage?: ReactNode;
  externalText?: string;
  externalLinkUrl?: string;
};

const Wrapper = styled.div`
  display: flex;
  @media (max-width: 767px) {
    display: block;
  }
`;

export const SwapPage = ({
  removePadding,
  noMinHeight,
  children,
  hideFooterOnDesktop,
  helpUrl,
  helpImage,
  externalText,
  externalLinkUrl,
  ...props
}: SwapPageProps) => (
  <AtomBox
    as={Wrapper}
    className={SwapCSS.pageVariants({ removePadding, noMinHeight })}
    style={{ padding: "50px 16px" }}
    {...props}
  >
    {children}
    <AtomBox display="flex" flexGrow={1} />
    <AtomBox display={["block", null, null, hideFooterOnDesktop ? "none" : "block"]} width="100%">
      <SwapFooter
        externalText={externalText}
        externalLinkUrl={externalLinkUrl}
        helpUrl={helpUrl}
        helpImage={helpImage}
      />
    </AtomBox>
  </AtomBox>
);
