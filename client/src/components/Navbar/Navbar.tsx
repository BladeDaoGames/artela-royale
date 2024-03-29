import React, {useMemo} from 'react';
import { Navbar } from 'flowbite-react';
import ConnectWalletButton from '../ConnectWalletButton/CWButton';
//import {SignUpButton} from '../ConnectWalletButton/SignUpButton';
import { BalanceButton } from './BalanceButton';
//import {GaslessSignUpButton} from '../ConnectWalletButton/GaslessSignupButton';
import {createDevPrivateKey} from '../../atoms';
import { useSetAtom } from 'jotai';

const CustomNavBar = () => {
    const setDevPk = useSetAtom(createDevPrivateKey);
    
    return (
        <Navbar className='top-0 left-0 z-20 w-full py-0 bg-background1'>
            <Navbar.Brand href={import.meta.env.VITE_HOSTSITE || "localhost:3000"}>
                <img
                    alt="Loot Royale Logo"
                    className="h-[5.5rem] mx-2 my-2 fill-prime2"
                    src="/SilverLogo.png"
                />
                <span className="text-2xl italic font-bold sm:text-3xl text-silver">
                    Loot Royale</span>
                </Navbar.Brand>
                
                {/* Dev tooling to let u set a dev private key for burner */}
                {(import.meta.env.VITE_ENV == "dev")&&
            <button className="w-10 h-10 bg-red-700"
            onClick={()=>{setDevPk("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d")}}></button>}

            {/* game rules button link */}
            <Navbar.Collapse className="ml-auto mr-2">
                <Navbar.Link href={import.meta.env.VITE_GAMERULESLINK} target="_blank">
                    <div className="text-sm font-medium  text-silver md:text-background1 md:bg-lightbeige md:rounded-lg md:text-base md:px-4 md:py-2 md:text-center md:hover:bg-darkbeige">
                        Game Rules</div>
                </Navbar.Link>
            </Navbar.Collapse>

            {/* faucet link */}
            <Navbar.Collapse className="mr-2">
                <Navbar.Link href={import.meta.env.VITE_FAUCETLINK || "https://blade-faucet.alt.technology/"}
                target="_blank"
                >
                    <BalanceButton/>
                </Navbar.Link>
            </Navbar.Collapse>

            {/* DO NOT NEED Gasless SignUp for Artela any more */}
            {/* <Navbar.Collapse className="mr-2">
                <GaslessSignUpButton />
            </Navbar.Collapse> */}

            <div className="flex">
                <ConnectWalletButton/>
                <Navbar.Toggle className="fill-current text-prime2 hover:bg-prime2 hover:text-white" />
            </div>
        </Navbar>
    )
}

export default CustomNavBar