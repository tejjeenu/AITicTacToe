import {useState, useEffect} from 'react';
import { motion, AnimatePresence } from "framer-motion";
import * as motionserver from "framer-motion/client";
import axios from 'axios';

function Square({value, onSquareClick, isHovered, isAipos}) {
  return (
    <motion.button
      className={`Btn ${isHovered ? 'hover-triggered' : ''}${isAipos ? 'hover-enemy' : ''}`}
      onClick={onSquareClick}
      //whileHover={isHovered ? { scale: 1.1 } : { scale: 1 }} // Scale effect on hover
      transition={{ duration: 1 }} // Duration of hover animation
      initial={{ opacity: 0 }} // Optional: Set initial state for Framer Motion
      animate={{ opacity: 1 }} // Animate opacity to fade in
    >
      <AnimatePresence>
        {(value === 'X' || value === 'O') && (
          <motion.div
            key="value"
            className="blender"
            initial={{ scale: 0, opacity: 0 }} // Start small and transparent
            animate={{ scale: 1, opacity: 1 }} // Animate to full size and opaque
            exit={{ scale: 0, opacity: 0 }} // Scale down and fade out when removed
            transition={{ duration: 0.3 }} // Adjust duration as needed
          >
            {value}
          </motion.div>
        )}        
      </AnimatePresence>
    </motion.button>
  );
}

export default function Board() {
  //for the squares
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [redhighlights, setRedhighlights] = useState(Array(9).fill(false));
  const [message, setMessage] = useState("your turn");
  //const [valtype, setValtype] = useState('X');
  const [isReplayVisible, setIsReplayVisible] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  //related to api calls
  const [dataReadyToSend, setDataReadyToSend] = useState(false); 
  const [getDataResponse, setGetDataResponse] = useState(null);
  const [postDataResponse, setPostDataResponse] = useState(null);
  //const [inputName, setInputName] = useState("");

  //for the api data

  function handleClick(i) {
    //the buttons are only clickable if the game has been restarted after being ended
    if ((squares[i] === " " || squares[i] === null) && !isReplayVisible && isPlayerTurn) {
      const nextSquares = squares.slice(); //split the squares into an array
      nextSquares[i] = 'X';
      setSquares(nextSquares);

        //if(valtype === 'X'){
        //  setValtype('O');
        //}
        //else{
        //  setValtype('X');
        //}

        //change this so that it is only setting the valtype to X and you disable this until the response is recieved
        //setValtype('X');

        //I want to then disable the functionality of the click for any of the buttons
      setIsPlayerTurn(false);

        //this line is sending the data over to api which 
      setDataReadyToSend(true);

    }
  }
  
  function handleReplayClick(){
    setIsHovered(true); // Trigger hover effect

    // Reset hover state after a brief delay (e.g., 300ms)
    setTimeout(() => {
      setIsHovered(false); // Reset hover state
      setSquares(Array(9).fill(null));
      //setRedhighlights(Array(9).fill(false));
      //setValtype('X');
      setMessage('your turn');
      setIsPlayerTurn(true);
      setIsReplayVisible(false);
    }, 300); // Duration should match the hover effect duration
  }

  useEffect(() => {
    if (dataReadyToSend) {
      // Trigger sendData when data is ready
      sendData(); 

      // Reset the data-ready state to avoid repeated sending
      setDataReadyToSend(false);
    }
  }, [dataReadyToSend]);
 

  // Function to fetch data from Flask using GET
  const fetchData = () => {
    axios.get('http://127.0.0.1:5000/api/getdata')  // Flask GET API endpoint
      .then(response => {
        setGetDataResponse(response.data);  // Set the response data
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  // Function to send data to Flask using POST
  const sendData = () => {

    setMessage('AI turn');

    const postData = {
      top: (squares[0] || " ") + '|' + (squares[1] || " ") + '|' + (squares[2] || " "),
      middle: (squares[3] || " ") + '|' + (squares[4] || " ") + '|' + (squares[5] || " "),
      bottom: (squares[6] || " ") + '|' + (squares[7] || " ") + '|' + (squares[8] || " ")
    };

    axios.post('https://minmax-api.vercel.app/api/postdata', postData)  // Flask POST API endpoint
      .then(response => {
        setPostDataResponse(response.data);  // Set the response from Flask
        
        const recievedSquares = [
          ...response.data.top.split("|"),
          ...response.data.middle.split("|"),
          ...response.data.bottom.split("|")
        ];
        
        //here I am getting the response and based on this the game continues
        let booleanArray = Array(9).fill(false);
        if(response.data.status !== 'ongoing'){
           if(response.data.status === 'AI wins!'){
             let triple = response.data.highlightred.split("|"); //array of the 3 positions
             booleanArray[Number(triple[0])] = true;
             booleanArray[Number(triple[1])] = true;
             booleanArray[Number(triple[2])] = true;
 
             setRedhighlights(booleanArray);
 
             setTimeout(() => { // Reset redhighlight state, this will ensure it is temporarily going on
               setRedhighlights(Array(9).fill(false));
             }, 300); 
           }
           //get the animation for the specific square the value was put before putting it
           setSquares(recievedSquares);
           setMessage(response.data.status);
           setIsReplayVisible(true); //game ends if it is not ongoing so restart button should be seen now
        }
        else{
           booleanArray[Number(response.data.aipos)] = true;
           setRedhighlights(booleanArray);

           setTimeout(() => { // Reset redhighlight state, this will ensure it is temporarily going on
            setRedhighlights(Array(9).fill(false));
           }, 300); //

           setSquares(recievedSquares);
           setMessage('your turn');
           setIsPlayerTurn(true);
           //setValtype('X');
        }
      })
      .catch(error => {
        console.error('Error posting data:', error);
      });
  };

  // Function to call the Flask API when the button is clicked
  
  return( 
    <>
      <div className="centered-container">
        
        <div className='upper'>
          <motion.h1
            key={message} // Trigger re-animation when the message changes
            className="fadeInMove" // CSS animation class
            initial={{ opacity: 0, scale: 0.9 }}  // Add Framer Motion effects (like scale)
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            {message}
          </motion.h1>
          <AnimatePresence>
            {(isPlayerTurn === false && isReplayVisible === false) && ( //change to condition (some way of indicating AI turn)
              <motion.div
                key="value"
                className="loader"
                initial={{ scale: 0, opacity: 0 }} // Start small and transparent
                animate={{ scale: 1, opacity: 1 }} // Animate to full size and opaque
                exit={{ scale: 0, opacity: 0 }} // Scale down and fade out when removed
                transition={{ duration: 0.3 }} // Adjust duration as needed
              >
                <li class="ball"></li>
                <li class="ball"></li>
                <li class="ball"></li>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="board">
          <div className="board-row">
            <Square value={squares[0]} onSquareClick={() => handleClick(0)} isHovered={isHovered} isAipos={redhighlights[0]}/>
            <Square value={squares[1]} onSquareClick={() => handleClick(1)} isHovered={isHovered} isAipos={redhighlights[1]}/>
            <Square value={squares[2]} onSquareClick={() => handleClick(2)} isHovered={isHovered} isAipos={redhighlights[2]}/>
          </div>
          <div className="board-row">
            <Square value={squares[3]} onSquareClick={() => handleClick(3)} isHovered={isHovered} isAipos={redhighlights[3]}/>
            <Square value={squares[4]} onSquareClick={() => handleClick(4)} isHovered={isHovered} isAipos={redhighlights[4]}/>
            <Square value={squares[5]} onSquareClick={() => handleClick(5)} isHovered={isHovered} isAipos={redhighlights[5]}/>
          </div>
          <div className="board-row">
            <Square value={squares[6]} onSquareClick={() => handleClick(6)} isHovered={isHovered} isAipos={redhighlights[6]}/>
            <Square value={squares[7]} onSquareClick={() => handleClick(7)} isHovered={isHovered} isAipos={redhighlights[7]}/>
            <Square value={squares[8]} onSquareClick={() => handleClick(8)} isHovered={isHovered} isAipos={redhighlights[8]}/>
          </div>
        </div>

        <AnimatePresence>
          {isReplayVisible && (
            <div className='lower'>
              <motion.button
                key="replay-button" // Key to trigger re-animation if needed
                className="ReplayBtn fadeInMove" // Apply your fadeInMove animation class
                onClick={handleReplayClick}
                initial={{ opacity: 0 }} // Optional: Set initial state for Framer Motion
                animate={{ opacity: 1 }} // Animate opacity to fade in
                exit={{ opacity: 0 }} // Animate opacity and position to fade out
                transition={{ duration: 0.5 }} // Optional: Transition duration
              >
                <i class="material-icons" style={{fontSize: '40px'}}>replay</i>
              </motion.button>
            </div>
          )}
        </AnimatePresence>
        
      </div>
    </>
  );
}
