import React from 'react';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
//import LobbyTable from './components/LobbyTable/LobbyTable';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Lobby from './pages/Lobby';
import GameRoom from './pages/GameRoom';
import useFetchRooms from './hooks/useFetchRooms';
import {useAtomValue} from 'jotai';
import { createProgressBar } from './atoms';
import { Toaster } from 'react-hot-toast';

function App() {

  // 0 to hundred percent progress bar
  const progressBarValue = useAtomValue(createProgressBar)

  // useEffect fetches rooms data from blockchain
  // VITE_ROOMLOADMODE === 'loop' will read each room data and populate an array on batch
  // else they get bulk data from the getGamesArray[]
  // Note this will do lots of reads on rpc, which is bad loading
  // TODO: try use multicall to reduce rpc calls
  useFetchRooms();

  return (
    <>
      <Navbar/>
        <main className='
              bg-[#34222E]
              flex flex-col min-h-screen
              items-center
              pt-0
              '>

              {progressBarValue <100? 

              // show a loading bar if below 100%
                <div className="
                mt-10
                w-1/2 flex-col justify-start items-center
                text-xs font-bold text-white
                ">
                  <div className="my-2 mb-1 text-base">LoAdiNg GaME DatA...</div>
                  <div className="w-full bg-gray-200 rounded-md dark:bg-gray-700">
                    <div className="bg-prime2  text-background1 text-sm
                    text-center p-0.5 leading-none rounded-md" 
                    style={{width: `${progressBarValue}%`}}>{`${progressBarValue}%`}</div>
                  </div>
                </div>
                :

              // after loaded, give routes
              <Router>
                  <Routes>
                    <Route path='/' element={<Lobby/>}/>
                    <Route path="/game/:id" element={<GameRoom />} />
                  </Routes>
                </Router>
                }
              </main>
      <Footer/>
      <Toaster position="top-center" toastOptions={{
          success:{
            style:{
              background: "#FEE9D7",
              color: "#34222E",
              border: "2px solid #53C576",
              borderRadius: "0.375rem",
            }
          },
          error:{
            style:{
              background: "#FEE9D7",
              color: "#34222E",
              border: "2px solid #C33030",
              borderRadius: "0.375rem",
            }
          }
        }}/>
    </>
  )
}

export default App
