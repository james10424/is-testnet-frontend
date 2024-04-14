import { Text, promotedGradient } from '@pancakeswap/uikit'
import { FeeAmount } from '@pancakeswap/v3-sdk'
import { LightTertiaryCard } from 'components/Card'
import { PoolState } from 'hooks/v3/types'
import { useFeeTierDistribution } from 'hooks/v3/useFeeTierDistribution'
import { styled } from 'styled-components'

import { FEE_AMOUNT_DETAIL } from './shared'

// height: 100%;
// ${({ active }) =>
//   active &&
//   css`
//     background-image: ${({ theme }) => theme.colors.gradientBold};
//   `}
const FeeOptionContainer = styled.div<{ active: boolean }>`
  cursor: pointer;
  animation: ${promotedGradient} 4s ease infinite;
  border-radius: 6px;
  padding: 2px 2px 4px 2px;
  &:hover {
    opacity: 0.7;
  }
`

interface FeeOptionProps {
  feeAmount: FeeAmount
  largestUsageFeeTier?: FeeAmount
  active: boolean
  distributions: ReturnType<typeof useFeeTierDistribution>['distributions']
  poolState: PoolState
  onClick: () => void
  isLoading?: boolean
}

export function FeeOption({
  feeAmount,
  active,
  poolState,
  distributions,
  onClick,
  largestUsageFeeTier,
  isLoading,
}: FeeOptionProps) {
  return (
    <FeeOptionContainer active={active} onClick={onClick}>
      <LightTertiaryCard
        active={active}
        invalid={!distributions || poolState === PoolState.NOT_EXISTS || poolState === PoolState.INVALID}
        padding={['6px 16px']}
        borderRadius="6px"
        height="auto"
      >
        {/* <AutoColumn gap="sm" justify="flex-start" height="100%" justifyItems="center"> */}
        <Text textAlign="center">{FEE_AMOUNT_DETAIL[feeAmount].label}%</Text>
        {/* {feeAmount === largestUsageFeeTier && '🔥'} */}
        {/* {isLoading ? (
            <Skeleton width="100%" height={16} />
          ) : distributions ? (
            <FeeTierPercentageBadge distributions={distributions} feeAmount={feeAmount} poolState={poolState} />
          ) : null} */}
        {/* </AutoColumn> */}
      </LightTertiaryCard>
    </FeeOptionContainer>
  )
}
