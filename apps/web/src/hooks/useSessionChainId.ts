import { atom, useAtom } from 'jotai'

const sessionChainIdAtom = atom<number>(1)

export const useSessionChainId = () => {
  return useAtom(sessionChainIdAtom)
}
