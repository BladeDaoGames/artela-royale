//import { MUDChain, latticeTestnet } from "@latticexyz/common/chains";
import { foundry, Chain } from "@wagmi/chains";

export const artela_testnet = {
    id: 11820,
    name: 'Artlea Testnet',
    network: 'artela_testnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Artela',
        symbol: 'ART',
    },
    rpcUrls: {
      default: {
        http: ['https://betanet-rpc1.artela.network'],
        webSocket: ['wss://betanet-rpc1.artela.network'],
      },
      public: {
        http: ['https://betanet-rpc1.artela.network'],
        webSocket: ['wss://betanet-rpc1.artela.network'],
      },
    },

    blockExplorers: {
        default: { name: 'Artela Scan', url: 'https://betanet-scan.artela.network/' },
    },

} as const satisfies Chain

// If you are deploying to chains other than anvil or Lattice testnet, add them here
export const supportedChains: Chain[] = [foundry, artela_testnet];
//export const supportedChains: MUDChain[] = [bladedao, foundry, latticeTestnet];
