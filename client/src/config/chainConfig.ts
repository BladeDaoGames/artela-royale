import { foundry} from "@wagmi/chains";
import { artela_testnet } from './supportedChains';
//
import RRoyale from './abis/RRoyale.json';

export const chainConfigs = {
    31337 : {
        config: foundry,
        contracts: {
            royale:"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            multicall: "0xca11bde05977b3631167028862be2a173976ca11"
        }
    },
    11820: {
        config: artela_testnet,
        contracts: {
            royale:"0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
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