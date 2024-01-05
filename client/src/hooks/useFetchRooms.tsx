import {useEffect, useRef} from 'react';
import { readContract } from '@wagmi/core';
import { formatUnits } from 'viem';
import {useAtom, useSetAtom} from 'jotai';
import { createTotalRoomsAtoom, createRoomAtom, createProgressBar } from '../atoms';
import { chainConfig } from '../config/chainConfig';



export const parseGameInfoObject= (roomInfo, roomId)=>{
    //console.log("parsing game info object")
    return {
        _roomId: roomId,
        _creator: roomInfo?.gameCreator as string,
        stake: parseFloat(formatUnits(roomInfo?.minStake, 18))/1.000??999 as number,
        boardrow: 10,
        boardcol: 10,
        players: parseInt(roomInfo?.playersCount)??1,
        maxplayers: 4,
        status: roomInfo?.hasEnded ? "Ended" : roomInfo?.gameAbandoned ? "Abandoned" : 
                !roomInfo?.hasStarted ? "Join" : "Spectate",
    }
}

const useFetchRooms = () => {
    const setTotalRooms = useSetAtom(createTotalRoomsAtoom)
    const setRooms = useSetAtom(createRoomAtom)
    const [progressBarValue, setProgressBarValue] = useAtom(createProgressBar)
    const fetchTimes = useRef<number>(0);
    //const fetchDone = useRef<boolean>(false);
    useEffect(()=>{
        //console.log(progressBarValue)
        if(progressBarValue<100){
            setTimeout(()=>{
                setProgressBarValue((t)=>{
                    if(t<100){
                        return t+1
                    }else{
                        return t
                    }
                })
            }, 10)
        }
    },[progressBarValue])

    useEffect(() => {
        //if(fetchDone.current) return;
        console.log(`getting total rooms data...(x${fetchTimes.current}`)
        fetchTimes.current +=1;

        let newTotalRooms = 0;
        //1. get total rooms now
        async function fetchAndPopulateRooms(newTotalRooms:number){

            if(import.meta.env.VITE_ROOMLOADMODE === 'loop'){
                await Promise.all(
                    //Array.apply(null, Array(newTotalRooms))
                    Array(parseInt(import.meta.env.VITE_ROOMBATCHSIZE)).fill(null).map((_, i)=>newTotalRooms-1-i)
                        .reverse()
                        .map(
                            async (roomId)=>{ //using this for loading only some rooms
                                return roomId>=0 ? await readContract({
                                    address: chainConfig.royaleContractAddress,
                                    abi: chainConfig.royaleAbi,
                                    functionName: 'games',
                                    args: [roomId]
                                }).then((res) => {
                                    return parseGameInfoObject(res, roomId)
                                    
                                }) : null
                                }
                            )
                        ).then((res)=>{
                            setRooms(res)
                            setProgressBarValue(()=>100)
                        }).catch((e)=>{console.log("Error in Loop Room Retrieval",e)})
            }else{
                await readContract({
                    address: chainConfig.royaleContractAddress,
                    abi: chainConfig.royaleAbi,
                    functionName: 'getGamesArray',
                }).then((res)=>{
                    setRooms(res?.map((room, i)=>{
                        return parseGameInfoObject(room?.info, i)
                        })
                    )
                    setProgressBarValue(()=>100)
    
                })
            }
        }

        async function getTotalRooms(){
            return await readContract({
                address: chainConfig.royaleContractAddress,
                abi: chainConfig.royaleAbi,
                functionName: 'getTotalGames',
            }).then((res)=>{
                newTotalRooms = parseInt(res as BigInt);
                setTotalRooms(newTotalRooms);

                //2. update rooms data by looping through all rooms
                fetchAndPopulateRooms(newTotalRooms);
        })}

        setProgressBarValue(()=>0)
        getTotalRooms()
        
        //fetchDone.current = true;
    },[])
}

export default useFetchRooms