import { Card, CardProps } from '@pancakeswap/uikit'
import { styled } from 'styled-components'

// border-radius: 24px;
export const BodyWrapper = styled(Card)`
  max-width: 637px;
  width: 100%;
  z-index: 1;
  border-radius: 8px;
  background-color: transparent;
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, ...cardProps }: { children: React.ReactNode } & CardProps) {
  return (
    <BodyWrapper {...cardProps} innerCardProps={{ style: { borderRadius: '8px' } }}>
      {children}
    </BodyWrapper>
  )
}
