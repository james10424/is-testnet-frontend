import { styled } from "styled-components";

import { ButtonProps, IconButton, ArrowUpDownIcon, ArrowDownIcon } from "@pancakeswap/uikit";
import { CurrencyInputPanel } from "./CurrencyInputPanel";
import { CurrencyInputHeader, CurrencyInputHeaderSubTitle, CurrencyInputHeaderTitle } from "./CurrencyInputHeader";
import { SwapPage as Page } from "./Page";
import { SwapFooter as Footer } from "./Footer";
import { SwapInfo as Info, SwapInfoLabel as InfoLabel } from "./SwapInfo";
import { TradePrice } from "./TradePrice";

const SwitchIconButton = styled(IconButton)`
  box-shadow: inset 0px -2px 0px rgba(0, 0, 0, 0.1);
  background-color: ${({ theme }) => theme.colors.primary};
  .icon-up-down {
    fill: white;
  }
  .icon-down {
    fill: white;
  }
`;
// &:hover {
//   .icon-down {
//     display: none;
//   }
//   .icon-up-down {
//     display: block;
//   }
// }

const SwitchButton = (props: ButtonProps) => (
  <SwitchIconButton variant="light" scale="sm" {...props}>
    {/* <ArrowDownIcon style={{ height: "20px" }} className="icon-down" color="primary" /> */}
    <ArrowUpDownIcon style={{ height: "24px" }} className="icon-up-down" color="primary" />
  </SwitchIconButton>
);

export {
  SwitchButton,
  CurrencyInputHeaderTitle,
  CurrencyInputHeaderSubTitle,
  CurrencyInputHeader,
  CurrencyInputPanel,
  Page,
  Footer,
  Info,
  InfoLabel,
  TradePrice,
};
