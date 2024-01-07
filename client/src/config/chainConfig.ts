import { foundry} from "@wagmi/chains";
import { artela_testnet } from './supportedChains';
//
//import RRoyale from './abis/RRoyale.json';
import RRoyale from './abis/Royale.json';

export const chainConfigs = {
    11822: {
        config: artela_testnet,
        contracts: {
            royale:"0x0A2A6892BbEc820631527Ea24D7FD22e19fC5E77",
            multicall: "0xca11bde05977b3631167028862be2a173976ca11"
        }
    },
    31337 : {
        config: foundry,
        contracts: {
            royale:"0x5FbDB2315678afecb367f032d93F642f64180aa3",
            multicall: "0xca11bde05977b3631167028862be2a173976ca11"
        }
    },
}

export const chainConfig = {
    chaindetails: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.config??foundry,
    royaleContractAddress: chainConfigs[import.meta.env.VITE_CHAIN_ID]?.contracts?.royale,
    //royaleAbi: Royale.abi
    royaleAbi: RRoyale.abi
}