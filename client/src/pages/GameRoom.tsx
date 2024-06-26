import React, {useEffect, useState, useMemo, useRef} from 'react';
import Phaser from 'phaser';
import GameSceneFlat from '../phaser/GameSceneFlat';
import usePhaserGame from '../phaser/usePhaserGame';

import {StakeAndEnterButton,
  LeaveRoomButton, ReadyUpButton, PlayerPauseButton, StartGameButton
} from '../components/GameRoom/Buttons';
import { TxnSenderHOC } from '../components/GameRoom/TxnSenderHOC';

import GameStatusBar from '../components/GameRoom/GameStatusBar';
import FTstatusBar from '../components/GameRoom/FTstatusBar';
import StakedBar from '../components/GameRoom/StakedBar';
import { useParams } from 'react-router-dom';
import { watchReadContracts, watchContractEvent, watchReadContract } from '@wagmi/core';
import { chainConfig } from '../config/chainConfig';
import { formatEther } from 'viem';
import {useAtom, useSetAtom} from 'jotai';
import { createGameInfoAtom, createPlayerIds, createPlayerFTs, 
  createPlayerAliveStatus, createPlayerReadiness, createGameSceneReadiness,
  createPlayerPauseVote, createTxnQueue} from '../atoms';
import { useAccount } from 'wagmi';
import {boardPositionToGameTileXY} from '../utils/gameCalculations'

import {subscribePhaserEvent, unsubscribePhaserEvent} from '../phaser/EventsCenter';
import ChatWindow from '../components/ChatWindow/ChatWindow';

import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin';


const GameRoom = () => {
  const params = useParams();
  const roomId = parseInt(params?.id as string)??0;
  const { address, isConnected } = useAccount();
  const [gameInfo, setGameInfo] = useAtom(createGameInfoAtom)
  const [gameSceneReady, setGameSceneReady] = useAtom(createGameSceneReadiness)

  // declare state of array of lenth 4
  const [playerIds, setPlayerIds] = useAtom(createPlayerIds)
  const [playerFTs, setPlayerFTs] = useAtom(createPlayerFTs)
  const [piecePositions, setPiecePositions] = useState<Array<number>>([
      255,255,255,255,
      255,255,255
      ])
  const [playerAliveStatus, setPlayerAliveStatus] = useAtom(createPlayerAliveStatus)
  const [playerReadyStatus, setPlayerReadyStatus] = useAtom(createPlayerReadiness)
  const [playerPauseVote, setPlayerPauseVote] = useAtom(createPlayerPauseVote)
  const [playerLoginCount, setPlayerLoginCount] = useState(0)
  const [ txnQueue, setTxnQueue] = useAtom(createTxnQueue)
  //const [playerLastMoveTime, setPlayerLastMoveTime] = useState<Array<number>>([0,0,0,0])
  // console.log("window inner width: ", window.innerWidth)
  // console.log("window inner height: ", window.innerHeight)
  const gameConfig = {
      type: Phaser.AUTO,
      parent: "phaser-div",
      backgroundColor: '#34222E',
      render: {
        antialias: false,
      },
      scale:{
          //width: 600,
          //height: 600,
          mode:  Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.Center.CENTER_BOTH,
          width: (window.innerHeight>880)?'100%': (window.innerHeight>800)?((900-window.innerHeight)/15*2+100)+'%':((900-window.innerHeight)/15*2+115)+'%',
          height: (window.innerHeight>880)?'100%':(window.innerHeight>800)?((900-window.innerHeight)/15*2+100)+'%':((900-window.innerHeight)/15*2+115)+'%',
          // width: '100%',
          // height: '100%',
          zoom: 1
          
      },
      physics:{
          default: 'arcade',
          arcade:{ gravity: { y: 0 } }
      },
      // plugins: {
      //   scene: [{
      //       key: 'rexUI',
      //       plugin: UIPlugin,
      //       mapping: 'rexUI'
      //   },
      //   ]
      // },
      scene: [GameSceneFlat]
  }
  const game = usePhaserGame(gameConfig);
  // game pointer events
  // game?.events.on('pointerFired', (e)=>{
  //   console.log("phaser outer pointer fired")
  //   console.log(e)
  // })

  const contractCallConfig = {
    contracts:[
      {
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getGameInfo',
        args: [roomId]
      },
      // {
      //   address: chainConfig.royaleContractAddress,
      //   abi: chainConfig.royaleAbi,
      //   functionName: 'getPlayerIds',
      //   args: [roomId]
      // },
      {
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerFTs',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPiecePositions',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerLives',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerReadiness',
        args: [roomId]
      },{
        address: chainConfig.royaleContractAddress,
        abi: chainConfig.royaleAbi,
        functionName: 'getPlayerPauseVote',
        args: [roomId]
      },
      // {
      //   address: chainConfig.royaleContractAddress,
      //   abi: chainConfig.royaleAbi,
      //   functionName: 'getPlayerLastMoveTime',
      //   args: [roomId]
      // },
    ],
    listenToBlock: true,
  }

  const playerIndex = playerIds.indexOf(address?.toLowerCase() as string)
  const playerInGame = playerIndex>=0
  const gamescene = game?.scene?.keys?.GameSceneFlat

  if(import.meta.env.VITE_ENV=="dev")console.log("game room render")

  // runs to position all pieces after every state refresh
  // runs first time and everytime pages freshes, player come into game, address change
  useEffect(()=>{
    if(import.meta.env.VITE_ENV=="dev")console.log("refreshing positions")
    if(import.meta.env.VITE_ENV=="dev")console.log(piecePositions)
    // console.log(gameSceneReady)
    // console.log(gamescene?.player1)
    
    //executes if game is ready to be controlled
    if(gameSceneReady&&gamescene?.player1){
        
        //ascertain userId (getting user Number from Phaser side)
        const userEntity = gamescene?.user?.entity
        const userId = parseInt(userEntity?.substr(userEntity?.length - 1))??null

        // execute if player is in the game
        if(playerInGame){
          
          //assign user to player if player is not tagged to user
          if(userId!=(playerIndex+1)){
            gamescene?.setUserToPlayer(playerIndex)
            // then set player to contract location to init yellow move guide
            //1st get the location in the contract
            const userBoardPosition = piecePositions[playerIndex]
            const userGameTileXY = boardPositionToGameTileXY(userBoardPosition)
            gamescene?.contractSetPlayerLoc(
              userGameTileXY.x, userGameTileXY.y
                )
          }
        }

        // execute to position all pieces
        piecePositions.forEach((p,i)=>{
            //assign position if position is not 255 (null)
            if(p!=255){
              const TileXY = boardPositionToGameTileXY(p)
              //if piece is not player update position
              if(i != playerIndex){
                gamescene?.setPiecePosition(i, TileXY.x, TileXY.y)
              
              // else if piece is player update only if returned position is same as intent
              // or update if it is first time refreshing
              }else if(playerInGame){
                const moveIntentXY = {
                  x:gamescene?.pieceArray[i].moveIntentPos.x,
                  y:gamescene?.pieceArray[i].moveIntentPos.y
                }
                // console.log(`player${i+1} returned pos: `, TileXY)
                // console.log(`player${i+1} move intent: `, moveIntentXY)

                //update for first time to refresh intent
                if((playerLoginCount<1)){
                  gamescene?.setPiecePosition(i, TileXY.x, TileXY.y)
                  setPlayerLoginCount(()=>1)
                
                  // update only if intent is same as returned position
                } else if((moveIntentXY.x==TileXY.x)&&(moveIntentXY.y==TileXY.y)){
                  gamescene?.setPiecePosition(i, TileXY.x, TileXY.y)
                  // because chain has received txn and update state, we can release txn queue
                  setTxnQueue(()=>0)
                }

              }

            }else{
              //if no item there, then remove item
              gamescene?.removePiecePosition(i)
            }
        })

    }
    
  },[gameSceneReady, piecePositions, playerInGame, address])
  
  //get current gameInfo and State in the room
  useEffect(()=>{
    if(import.meta.env.VITE_ENV=="dev")console.log("useGetGameInfo Hook.") // only once
    const unwatch = watchReadContracts(contractCallConfig, (data_)=>{
      // refreshes each time chain state changes
      console.log("chain state refreshed.")
      //if(import.meta.env.VITE_ENV=="dev")console.log(data_)

      // gameinfo data
      if(data_[0]?.status=="success"){
        //console.log("game info data success")
        //console.log(data_[0]?.result)
        setGameInfo({...data_[0]?.result,
          minStake: parseFloat(formatEther(data_[0]?.result?.minStake??0)),
          totalStaked: parseFloat(formatEther(data_[0]?.result?.totalStaked??0))
        })
      }else{
        console.log("game info data retrieve failed")
      }

      //playerIds data
      // if(data_[1]?.status=="success"){
      //   setPlayerIds((data_[1].result as string[])?.map((a: string)=>{
      //       return a?.toLocaleLowerCase()?? "0x0"
      //   }))
      // }

      //playerFTs data
      if(data_[1]?.status=="success"){
        setPlayerFTs(data_[1].result)
      }

      //piece positions data
      if(data_[2]?.status=="success"){
        setPiecePositions(data_[2].result)
      }

      //playerAlive data
      if(data_[3]?.status=="success"){
        setPlayerAliveStatus(data_[3].result)
      }

      //playerReadiness data
      if(data_[4]?.status=="success"){
        setPlayerReadyStatus(data_[4].result)
      }

      //playerReadiness data
      if(data_[5]?.status=="success"){
        setPlayerPauseVote(data_[5].result)
      }

    });

    return ()=>{
      unwatch();
    }
  }, [])

  //only get for playerId states
  useEffect(()=>{
    console.log("init playerId listeners")

    const unwatchPlayerIds = watchReadContract(
      {
      address: chainConfig.royaleContractAddress,
      abi: chainConfig.royaleAbi,
      functionName: 'getPlayerIds',
      args: [roomId],
      listenToBlock: true,
      }, (data_)=>{

        console.log("player Ids refreshed")
        setPlayerIds((data_ as string[])?.map((a: string)=>{
          return a?.toLocaleLowerCase()?? "0x0"
        }))
    })

    return ()=>{
      unwatchPlayerIds();
    }
  },[])

  //get event data seperate from above useEffects
  useEffect(()=>{
    console.log("event data listeners")
    const unwatchPlayerKilledEvent = watchContractEvent({
      address: chainConfig.royaleContractAddress,
      abi: chainConfig.royaleAbi,
      eventName: 'PlayerKilled',
    }, (data_)=>{
      const args = data_[0]?.args
      if(args?._roomId==roomId){
        try{
          const playerKilledAddress = args?._player
          const playerNumber = playerIds.indexOf(playerKilledAddress.toLowerCase())+1
          const _roomId = parseInt(args?._roomId)
          const boardPosition = args?._tilePos
          const tileXY = boardPositionToGameTileXY(boardPosition)
          console.log("player killed event",playerKilledAddress, tileXY)
          gamescene?.announcePlayerKilled(playerNumber, tileXY.x, tileXY.y)

          //console.log(playerIds)
        }catch(e){
          console.log("player killed event error")
          console.log(e)
        }
      }
    });

    const unwatchPlayerKilledVictimEvent = watchContractEvent({
      address: chainConfig.royaleContractAddress,
      abi: chainConfig.royaleAbi,
      eventName: 'PlayerKilledPlayer',
    }, (data_)=>{
      const args = data_[0]?.args
      if(args?._roomId==roomId){
        try{
          const aggressorAddress = args?._aggressor
          const aggressorNumber = playerIds.indexOf(aggressorAddress.toLowerCase())+1
          const victimAddress = args?._victim
          const victimNumber = playerIds.indexOf(victimAddress.toLowerCase())+1
          const boardPosition = args?._tilePos
          const tileXY = boardPositionToGameTileXY(boardPosition)
          const _roomId = parseInt(args?._roomId)
          console.log("player killed another player event",aggressorAddress, " killed ",victimAddress, "at ", tileXY)
          console.log(_roomId, aggressorNumber, victimNumber)
          gamescene?.showPlayerKplayerToast(aggressorNumber, victimNumber, tileXY.x, tileXY.y)
          //console.log(playerIds)
        }catch(e){
          console.log("player k player event error")
          console.log(e)
        }
      }
    });

    const unwatchItemOpened = watchContractEvent({
      address: chainConfig.royaleContractAddress,
      abi: chainConfig.royaleAbi,
      eventName: 'ItemOpened',
    }, (data_)=>{
      const args = data_[0]?.args
      if(args?._roomId==roomId){
        try{
          const playerAddress = args?._player
          const playerNumber = playerIds.indexOf(playerAddress.toLowerCase())+1
          const _roomId = parseInt(args?._roomId)
          const itemPosition = args?._tilePos
          const itemTileXY = boardPositionToGameTileXY(itemPosition)
          const ftBuff = args?._ftDiff

          console.log("item opened event",playerAddress, itemPosition, ftBuff)

          gamescene?.showToast(playerNumber, `Player${playerNumber} \n🎁 Opened chest at ${itemTileXY.x}, ${itemTileXY.y} 🎁 \ngained ${ftBuff<0?"💀":"💪🏼 +"}${ftBuff}FT`, 
          itemTileXY.x, itemTileXY.y)

        }catch(e){
          console.log("item opened event error")
          console.log(e)
        }
      }
    });


    return ()=>{
      unwatchPlayerKilledEvent();
      unwatchPlayerKilledVictimEvent();
      unwatchItemOpened();
    }
  },[playerIds])

  //suscribe to game events
  useEffect(()=>{
    subscribePhaserEvent("playerMoveIntentConfirmed", (e)=>{
      //console.log("player confirmed move")
      //console.log(e)
    })

    subscribePhaserEvent("playersLoaded", (e)=>{
      console.log("game scene loaded.")
      setGameSceneReady(true)
      //console.log(e)
    })

    return ()=>{
      unsubscribePhaserEvent("playerMoveIntentConfirmed", ()=>{});
      unsubscribePhaserEvent("playersLoaded", ()=>{});
    }

  },[])
  
  return (

    <div className="flex flex-row 
    flex-wrap
    justify-center items-start 
    w-full
    ">
      {/* <button className="w-10 h-10 bg-red-700" onClick={()=>{console.log(gamescene.player1)}}/> */}
      
      {/* balancing div */}
      <div className="
      ">
          <TxnSenderHOC game={game} roomId={roomId}/>
        </div>

      {/* main center container panel w-768px */}
        <div className="justify-self-center w-full md:w-[768px]
              flex flex-col
              p-0 h-screen
              items-center
              px-8
          "
        >

          {/* game container is 60vh for square map*/}
          {/* <div className="w-[60vh]
          border border-blue-500
          overflow-x-hidden
          "> */}
              {/* game status bar */}
              <GameStatusBar/>
              <FTstatusBar/>
              <StakedBar/>
              {/* border-2 border-blue-500 rounded-lg */}
              <div id="phaser-div" className="
              App
              h-[60vh] aspect-square mt-0
              
              overflow-hidden
              "/>

              <div className="flex flex-row gap-1 items-center justify-center py-2 ">

              {/* start game */}
              <StartGameButton room={roomId}/>

                {/* vote for pause */}
                <PlayerPauseButton room={roomId}/>

                {/* signal ready */}
                <ReadyUpButton room={roomId}/>

                {/* leave game */}
                <LeaveRoomButton room={roomId}/>

                {/* enter game */}
                <StakeAndEnterButton room={roomId}/>

              </div>

            {/* </div> */}
        </div>

        {/* chat window */}
        <div className="w-full
        min-w-[400px] max-w-[500px]
        h-[30vh] md:h-[90vh]
        ">
          <ChatWindow room={roomId?.toString()} msgLimit={100} />
        </div>
      
      </div>
  )
}

export default GameRoom