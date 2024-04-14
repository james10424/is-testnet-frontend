import { useTranslation } from '@pancakeswap/localization'
import { Currency } from '@pancakeswap/swap-sdk-core'
import { Button, useModal } from '@pancakeswap/uikit'
import { useIsExpertMode, useUserSlippage } from '@pancakeswap/utils/user'
import { NonfungiblePositionManager } from '@pancakeswap/v3-sdk'
import { ConfirmationModalContent } from '@pancakeswap/widgets-internal'
import TransactionConfirmationModal from 'components/TransactionConfirmationModal'
import { useIsTransactionUnsupported, useIsTransactionWarning } from 'hooks/Trades'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useTransactionDeadline } from 'hooks/useTransactionDeadline'
import useV3DerivedInfo from 'hooks/v3/useV3DerivedInfo'
import { useCallback, useMemo, useState } from 'react'
import { Field } from 'state/mint/actions'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin } from 'utils'
import { logGTMClickAddLiquidityEvent } from 'utils/customGTMEventTracking'
import { basisPointsToPercent } from 'utils/exchange'
import { formatCurrencyAmount, formatRawAmount } from 'utils/formatCurrencyAmount'
import { isUserRejected } from 'utils/sentry'
import { transactionErrorToUserReadableMessage } from 'utils/transactionErrorToUserReadableMessage'
import { getViemClients } from 'utils/viem'
import { hexToBigInt } from 'viem'
import { useSendTransaction, useWalletClient } from 'wagmi'
import { V3SubmitButton } from './components/V3SubmitButton'
import { PositionPreview } from './formViews/V3FormView/components/PositionPreview'
import { useV3MintActionHandlers } from './formViews/V3FormView/form/hooks/useV3MintActionHandlers'
import { useV3FormAddLiquidityCallback, useV3FormState } from './formViews/V3FormView/form/reducer'

interface V3FormViewPropsType {
  baseCurrency?: Currency | null
  quoteCurrency?: Currency | null
  currencyIdA?: string
  currencyIdB?: string
  feeAmount?: number
}

const SubmitBtn = ({ feeAmount, baseCurrency, quoteCurrency, currencyIdA, currencyIdB }: V3FormViewPropsType) => {
  const formState = useV3FormState()
  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
    tickSpaceLimits,
  } = useV3DerivedInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    undefined,
    formState,
  )
  const addIsUnsupported = useIsTransactionUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)
  const addIsWarning = useIsTransactionWarning(currencies?.CURRENCY_A, currencies?.CURRENCY_B)
  const { account, chainId, isWrongNetwork } = useActiveWeb3React()
  // check whether the user has approved the router on the tokens
  const nftPositionManagerAddress = useV3NFTPositionManagerContract()?.address
  const {
    approvalState: approvalA,
    approveCallback: approveACallback,
    revokeCallback: revokeACallback,
    currentAllowance: currentAllowanceA,
  } = useApproveCallback(parsedAmounts[Field.CURRENCY_A], nftPositionManagerAddress)
  const {
    approvalState: approvalB,
    approveCallback: approveBCallback,
    revokeCallback: revokeBCallback,
    currentAllowance: currentAllowanceB,
  } = useApproveCallback(parsedAmounts[Field.CURRENCY_B], nftPositionManagerAddress)
  const isValid = !errorMessage && !invalidRange
  const showApprovalA = approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB = approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]
  const [txHash, setTxHash] = useState<string>('')
  const [txnErrorMessage, setTxnErrorMessage] = useState<string | undefined>()
  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput, onBothRangeInput } =
    useV3MintActionHandlers(noLiquidity)
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()
  const handleDismissConfirmation = useCallback(() => {
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
    setTxnErrorMessage(undefined)
  }, [onFieldAInput, txHash])
  const expertMode = useIsExpertMode()
  const { data: signer } = useWalletClient()
  const positionManager = useV3NFTPositionManagerContract()

  const [deadline] = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippage() // custom from users
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const { sendTransactionAsync } = useSendTransaction()
  const translationData = useMemo(() => {
    if (depositADisabled) {
      return {
        amount: formatCurrencyAmount(parsedAmounts[Field.CURRENCY_B], 4, locale),
        symbol: currencies[Field.CURRENCY_B]?.symbol ? currencies[Field.CURRENCY_B].symbol : '',
      }
    }
    if (depositBDisabled) {
      return {
        amount: formatCurrencyAmount(parsedAmounts[Field.CURRENCY_A], 4, locale),
        symbol: currencies[Field.CURRENCY_A]?.symbol ? currencies[Field.CURRENCY_A].symbol : '',
      }
    }
    return {
      amountA: formatCurrencyAmount(parsedAmounts[Field.CURRENCY_A], 4, locale),
      symbolA: currencies[Field.CURRENCY_A]?.symbol ? currencies[Field.CURRENCY_A].symbol : '',
      amountB: formatCurrencyAmount(parsedAmounts[Field.CURRENCY_B], 4, locale),
      symbolB: currencies[Field.CURRENCY_B]?.symbol ? currencies[Field.CURRENCY_B].symbol : '',
    }
  }, [depositADisabled, depositBDisabled, parsedAmounts, locale, currencies])
  const pendingText = useMemo(
    () =>
      !outOfRange
        ? t('Supplying %amountA% %symbolA% and %amountB% %symbolB%', translationData)
        : t('Supplying %amount% %symbol%', translationData),
    [t, outOfRange, translationData],
  )
  const addTransaction = useTransactionAdder()
  const onAddLiquidityCallback = useV3FormAddLiquidityCallback()
  const [onPresentAddLiquidityModal] = useModal(
    <TransactionConfirmationModal
      minWidth={['100%', null, '420px']}
      title={t('Add Liquidity')}
      customOnDismiss={handleDismissConfirmation}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      errorMessage={txnErrorMessage}
      content={() => (
        <ConfirmationModalContent
          topContent={() =>
            position ? (
              <PositionPreview
                position={position}
                inRange={!outOfRange}
                ticksAtLimit={ticksAtLimit}
                baseCurrencyDefault={baseCurrency}
              />
            ) : null
          }
          bottomContent={() => (
            <Button width="100%" mt="16px" onClick={onAdd}>
              {t('Add')}
            </Button>
          )}
        />
      )}
      pendingText={pendingText}
    />,
    true,
    true,
    'TransactionConfirmationModal',
  )

  const onAdd = useCallback(async () => {
    if (!chainId || !signer || !account || !nftPositionManagerAddress) return

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (position?.liquidity === 0n) {
      setTxnErrorMessage(t('The liquidity of this position is 0. Please try increasing the amount.'))
      return
    }

    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, {
        slippageTolerance: basisPointsToPercent(allowedSlippage),
        recipient: account,
        deadline: deadline.toString(),
        useNative,
        createPool: noLiquidity,
      })

      setAttemptingTxn(true)
      const txn = {
        data: calldata,
        to: nftPositionManagerAddress,
        value: hexToBigInt(value),
        account,
      }
      getViemClients({ chainId })
        ?.estimateGas(txn)
        .then((gas) => {
          sendTransactionAsync({
            ...txn,
            gas: calculateGasMargin(gas),
          })
            .then((response) => {
              const baseAmount = formatRawAmount(
                parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
                baseCurrency.decimals,
                4,
              )
              const quoteAmount = formatRawAmount(
                parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
                quoteCurrency.decimals,
                4,
              )

              setAttemptingTxn(false)
              addTransaction(response, {
                type: 'add-liquidity-v3',
                summary: `Add ${baseAmount} ${baseCurrency?.symbol} and ${quoteAmount} ${quoteCurrency?.symbol}`,
              })
              setTxHash(response.hash)
              onAddLiquidityCallback(response.hash)
            })
            .catch((error) => {
              console.error('Failed to send transaction', error)
              // we only care if the error is something _other_ than the user rejected the tx
              if (!isUserRejected(error)) {
                setTxnErrorMessage(transactionErrorToUserReadableMessage(error, t))
              }
              setAttemptingTxn(false)
            })
        })
    }
  }, [
    account,
    addTransaction,
    allowedSlippage,
    baseCurrency,
    chainId,
    deadline,
    nftPositionManagerAddress,
    noLiquidity,
    onAddLiquidityCallback,
    parsedAmounts,
    position,
    positionManager,
    quoteCurrency,
    sendTransactionAsync,
    signer,
    t,
  ])
  const handleButtonSubmit = useCallback(() => {
    // eslint-disable-next-line no-unused-expressions
    expertMode ? onAdd() : onPresentAddLiquidityModal()
    logGTMClickAddLiquidityEvent()
  }, [expertMode, onAdd, onPresentAddLiquidityModal])

  return (
    <V3SubmitButton
      addIsUnsupported={addIsUnsupported}
      addIsWarning={addIsWarning}
      account={account ?? undefined}
      isWrongNetwork={Boolean(isWrongNetwork)}
      approvalA={approvalA}
      approvalB={approvalB}
      isValid={isValid}
      showApprovalA={showApprovalA}
      approveACallback={approveACallback}
      currentAllowanceA={currentAllowanceA}
      revokeACallback={revokeACallback}
      currencies={currencies}
      showApprovalB={showApprovalB}
      approveBCallback={approveBCallback}
      currentAllowanceB={currentAllowanceB}
      revokeBCallback={revokeBCallback}
      parsedAmounts={parsedAmounts}
      onClick={handleButtonSubmit}
      attemptingTxn={attemptingTxn}
      errorMessage={errorMessage}
      buttonText={t('Add')}
      depositADisabled={depositADisabled}
      depositBDisabled={depositBDisabled}
    />
  )
}

export default SubmitBtn
