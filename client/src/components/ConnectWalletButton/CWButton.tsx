import React, {useCallback, useEffect, useMemo} from 'react';
import { useAccount, useConnect } from 'wagmi';
import { addressShortener } from '../../utils/addressShortener';

import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { MockConnector } from 'wagmi/connectors/mock';

import {createDevPrivateKey } from '../../atoms';
import { useAtomValue } from 'jotai';
import { supportedChains } from '../../config/supportedChains';
import { chainConfig } from '../../config/chainConfig';
import {useBurnerKey} from '../../hooks/useBurnerKey';
import {BiCopy} from 'react-icons/bi';
import { Tooltip } from 'flowbite-react';
import { toast } from 'react-hot-toast';

const CWButton = () => {
    const { address, isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { burnerKey, burnerAddress, updateBurnerKey } = useBurnerKey();
    const burnerIsConnected = (address?.toLowerCase()==burnerAddress?.toLowerCase())&&(isConnected)
    const shortAddress = addressShortener(address as string)

    const devPk = useAtomValue(createDevPrivateKey)
    
    const handleConnect = useCallback(() => {
        //if(!isConnected){
            //if in dev mode use dev pk
            if (import.meta.env.VITE_ENV == "dev"){
                const viemAccount = privateKeyToAccount(devPk)
                const cachedClient = createWalletClient({
                    account:viemAccount,
                    chain: chainConfig.chaindetails,
                    transport: http()
                }).extend(publicActions) 
            
                const cachedConnector = new MockConnector({
                    chains: supportedChains,
                    options: {
                        walletClient: cachedClient,
                    },
                })
                // connect to new PK
                connect({connector: cachedConnector})
                return
            }

            // if burner is already connected (edge case)
            if (burnerIsConnected) return

            // if burnerKey not created, create it
            burnerKey==null ? updateBurnerKey(()=>generatePrivateKey()): null;
            //if burner wallet available, use burner to connect
            if(burnerKey !==null){
                const viemAccount = privateKeyToAccount(burnerKey) 
                const cachedClient = createWalletClient({
                    account: viemAccount,
                    chain: chainConfig.chaindetails,
                    transport: http()
                }).extend(publicActions) 
            
                const cachedConnector = new MockConnector({
                    chains: supportedChains,
                    options: {
                        flags:{
                            isAuthorized:true,
                        },
                        walletClient: cachedClient,
                    },
                })
                // connect to new PK
                connect({connector: cachedConnector})
                return
            }

            
            // COMMENTED OUT BECAUSE WE ARE GOING TO CONNEC TO BURNER WALLET ALL THE TIME
            // else connect normally with metamask injected
            // connect({ connector: connectors[0] })
            return
        
            // DO NOT DISCONNECT BECAUSE USERS WILL BE CONFUSED
    },[devPk, connect, connectors, disconnect, burnerKey, 
        address, isConnected, burnerIsConnected])

    useEffect(()=>{
        // it is dev, auto connect
        if (import.meta.env.VITE_ENV == "dev"){
            handleConnect();
        }

        // just connect everytime
        handleConnect();

    },[burnerKeyRegisteredFlagCount, handleConnect, isConnected])

    return useMemo(()=>(
        <div className="flex flex-row flex-nowrap
        text-white
        font-medium text-sm md:text-base
        bg-prime1
        hover:bg-prime2 hover:text-background1
        rounded-lg
        ">
            <div
                className={`
                focus:ring-2 focus:outline-none focus:ring-lightbeige 
                
                ${isConnected?"pl-4 pr-2":"px-4"} py-2 text-center mr-3 md:mr-0
                max-w-[132px] md:max-w-none`}

                onClick={() => handleConnect()}
                >
                {isConnected ? 
                <div className="flex flex-row items-center">
                    <Tooltip content={address}>
                        <span>{shortAddress}</span>
                    </Tooltip>
                    
                    </div> 
                : "Connect Wallet"}
            </div>
            {isConnected?
            <button className={`
            flex flex-row items-center justify-center
            rounded-r-lg hover:bg-lightbeige
            hover:text-alertred1 hover:text-lg
            pl-2 pr-4`}
                onClick={()=>{
                    navigator.clipboard.writeText(address as string)
                    toast.success(
                        <div className="p-2 break-all">{`Address ${address} Copied!`}</div>
                        , {icon: '📋'})
                }}
                >
                <Tooltip content={"copy address to clipboard"}>
                <BiCopy className={`text-center align-middle`}/>
                </Tooltip>
            </button>
            :null}
        </div>
    ),[isConnected, address, burnerKey, burnerIsConnected, handleConnect])
}

export default CWButton