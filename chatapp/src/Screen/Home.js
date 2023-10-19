import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import io from 'socket.io-client';
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { LuPhoneCall } from "react-icons/lu";
import { FaShareFromSquare } from "react-icons/fa6";
import { GrCopy } from "react-icons/gr";
import { HiOutlinePhoneMissedCall } from "react-icons/hi";
import { LuScreenShare } from "react-icons/lu";
import { ImPhoneHangUp } from "react-icons/im";
import { LuScreenShareOff } from "react-icons/lu";



//import { LuPhoneCall, FaShareFromSquare, GrCopy, HiOutlinePhoneMissedCall, LuScreenShare, ImPhoneHangUp } from 'react-icons/all';





const socket = io('https://screenshare-exd1.onrender.com');
//const socket = io('http://localhost:5000');

function App() {
  const [me, setMe] = useState('');
  const [stream, setStream] = useState(null);
  const [name, setName] = useState('');
  const [callAccepted, setCallAccepted] = useState(false);
  const [caller, setCaller] = useState('');
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);
  const [idToCall, setIdToCall] = useState('');
  const [callEnded, setCallEnded] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [count, setCount] = useState(0)
  const [copyId, setCopyId] = useState('Copy Id')
  const [hideCallbutton, sethideCallbutton] = useState(false)
  const [callStaus, setcallStaus] = useState('')
  const [callbut, setcallbut] = useState(false)
  const [hidesharebut,setHidesharebut] = useState(false)




  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const myInputRef = useRef();



  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((userStream) => {
        setStream(userStream);
        if (myVideo.current) {
          myVideo.current.srcObject = userStream;
        }

      })
      .catch((error) => {
        console.error('Error accessing user media:', error);
      });



    socket.on('me', (id) => {
      setMe(id)
    });

    if (name.length === 0) {
      setName('Someone')
    }

    socket.on('callUser', (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);

    });

    receivingCall ? setcallStaus('Ringing ......') : setcallStaus('')

    socket.on('callrecstatus', (data) => {
      // console.log(data)
      setcallStaus(data)
    })



  }, [callAccepted, count ]);


  useEffect(() => {
    myInputRef.current.focus();
  }, [])




  const callUser = (id) => {

    // setCount(count + 1)
    const peer = new Peer({ initiator: true, trickle: false, stream: stream });

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    socket.on('callAccepted', (signal) => {
      setCount(count + 1)
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;

    setcallStaus(' Ringing.....')

    console.log('Rahul')
  };


  const answerCall = () => {
    console.log('Rahul')
    setCallAccepted(true);
    setCount(count + 1)

    const peer = new Peer({ initiator: false, trickle: false, stream: stream });

    peer.on('signal', (data) => {

      socket.emit('answerCall', { signal: data, to: caller });
    });

    peer.on('stream', (remoteStream) => {

      if (userVideo.current) {
        userVideo.current.srcObject = remoteStream;
      }
    });

    peer.signal(callerSignal);

    connectionRef.current = peer;
  };



  const startScreenShare = () => {
    setHidesharebut(!hidesharebut)
    setCount(count + 1)

    if (screenSharing) {
      stopScreenShare();
      return;
    }

    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((screenStream) => {
        setScreenStream(screenStream);

        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrack.onended = stopScreenShare;

        if (connectionRef.current) {
          const sender = connectionRef.current._pc.getSenders().find((s) => s.track.kind === 'video');
          sender.replaceTrack(screenTrack);
        }

        setScreenSharing(true);
      })
      .catch((error) => {
        console.error('Error starting screen share:', error);
      });
  };



  const stopScreenShare = () => {
  
    if (!screenSharing) return;

    const screenTrack = screenStream.getVideoTracks()[0];

    if (connectionRef.current) {
      const sender = connectionRef.current._pc.getSenders().find((s) => s.track.kind === 'video');
      sender.replaceTrack(stream.getVideoTracks()[0]);
    }

    screenTrack.stop();
    setScreenSharing(false);
    setScreenStream(null);
  };


  
  const leaveCall = useCallback(()=>{
    socket.emit('bothEnd', 'cut call')
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  },[callEnded])


  const handleShareJoiningCode = async (url) => {
   
    sethideCallbutton(true)
    setcallStaus('Connecting.....')

    if (navigator.share) {
      try {
        await navigator.share({
          text: me,

        });

      }
      catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };



  const cutCall = useCallback(()=>{
   
    socket.emit('callStatuss', 'Cut Your Call...')
    setCount(count + 1)
    setReceivingCall(false)
    sethideCallbutton(false)
    setcallStaus('')
    // window.location.reload();
  },[count])


  useEffect(() => {
    socket.on('cutCallBoth', (data) => {
      console.log(data)
      setCallEnded(true)
      setcallbut(true)
    })
  }, [])





  const handlecutMAinCall = useCallback(()=>{
    
    setcallbut(false)
    setCallEnded(true);
    connectionRef.current.destroy();
    window.location.reload();
  },[callbut])



  return (
    <div>
      {callAccepted && !callEnded ? (
        <>
          <div className='videoframe'>

            <div className='connectedVideo'>
              <video className='userVideo' ref={userVideo} autoPlay playsInline></video>
            </div>

            {screenSharing ? (
              <>
                <video className='ownVideo' ref={userVideo} autoPlay playsInline ></video>
              </>
            ) : (
              <video className='screenVideo' ref={myVideo} autoPlay playsInline muted ></video>
            )}

          </div>

          <div className='but'>
              {
                !hidesharebut?<LuScreenShare className='shreIcon' onClick={startScreenShare}> </LuScreenShare>
                :
                <LuScreenShareOff className='shreIcon' onClick={startScreenShare}> </LuScreenShareOff>
              }
          </div>

          {/* <button className='but' onClick={startScreenShare}>
            {screenSharing ? 'Stop' : 'Screen'}
          </button> */}

        </>
      ) : (


        <div>

          <div className='myVideodiv'>
            <video className='myVideo' ref={myVideo} autoPlay playsInline muted></video>
          </div>

          {receivingCall && !callAccepted ? (
            <div className='anserCalll'>
              <h1 className='callingheading'>{name} is calling...</h1>

              <div className='callButtton'>
                <div className='REccallIcon'>
                  <LuPhoneCall className='callI' onClick={answerCall}></LuPhoneCall>
                </div>

                <div className='cutCall'>
                  <HiOutlinePhoneMissedCall className='callI' onClick={cutCall}></HiOutlinePhoneMissedCall>
                </div>
              </div>

            </div>
          ) : !receivingCall && !callbut ? (

            <div>
              <div className='contentBox'>
                <input ref={myInputRef} className='in' type='text' placeholder='Enter Your Name' onChange={e => setName(e.target.value)}></input>

                <div className='both-button'>

                  <div className='sharebutt'>
                    <div className='coppy'>
                      <FaShareFromSquare onClick={() => handleShareJoiningCode(me)} className='copyy'></FaShareFromSquare>
                    </div>
                    <p className='con'>Share Id</p>
                  </div>

                  <div className='sharebutt'>
                    <CopyToClipboard text={me} >
                      <div className='copyyy'>
                        <GrCopy onClick={() => { setCopyId('Copyed Id'); sethideCallbutton(true); setcallStaus('Conneting.....') }} className='copIcon'></GrCopy>
                      </div>
                    </CopyToClipboard>
                    <p className='con'>{copyId}</p>
                  </div>
                </div>

                <div className='callbutt'>

                  {
                    hideCallbutton === false ?
                      <>
                        <input className='in' type="text" placeholder='Enter Id for Call' value={idToCall} onChange={(e) => setIdToCall(e.target.value)} />
                        <div className='callIcon'>
                          <LuPhoneCall className='callI' onClick={() => callUser(idToCall)}></LuPhoneCall>
                        </div>
                        <div>
                          <h2>{callStaus}</h2>
                        </div>
                      </>
                      :
                      <div>
                        <h2>{callStaus}</h2>
                      </div>
                  }
                </div>
              </div>


            </div>

          )
            :
            (
              <div className='cutcallbg'>
                <div className='cutpage'> </div>
                <div className='cutCauuButt'>
                  <ImPhoneHangUp className='hangUpIcon' onClick={handlecutMAinCall}>cut call</ImPhoneHangUp>

                </div>
                <h3 className='cutcallEnded'>Call ended ....</h3>
              </div>
            )
          }

        </div>


      )}

      {callAccepted && !callEnded && (

        <div className='hangUp'>
          <ImPhoneHangUp className='hangUpIcon' onClick={leaveCall}>Hang Up</ImPhoneHangUp>
        </div>

      )}
    </div>
  );
}

export default App;
