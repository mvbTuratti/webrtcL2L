// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
import Home from './components/home/Home'
import './App.css'
// import { Socket } from 'phoenix';

function App() {
  // const socket = new Socket('/socket');
  // socket.connect();
  // const channel = socket.channel(`room:test`, {})
  // channel.join()
  //   .receive("ok", resp => { console.log("Joined successfully", resp) })
  //   .receive("error", resp => { console.log("Unable to join", resp) })

  return (
    <>
      <Home></Home>
    
    </>
  )
}

export default App
