import { DefaultSeoProps } from 'next-seo'

export const SEO: DefaultSeoProps = {
  titleTemplate: '%s | iSwap',
  defaultTitle: 'iSwap',
  description: 'The Liquidity Reshaper in Web3 Space',
  // twitter: {
  //   cardType: 'summary_large_image',
  //   handle: '@PancakeSwap',
  //   site: '@PancakeSwap',
  // },
  openGraph: {
    title: 'iSwap - The Liquidity Reshaper in Web3 Space',
    description: 'Liquidity infrastructure provider focused on enhancing market efficiency',
    images: [{ url: `${process.env.NEXT_PUBLIC_ISWAP_URL}/images/seo.png` }],
  },
}
