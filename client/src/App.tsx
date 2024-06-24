import Smile from "./pages/Smile";
import Home from "./pages/Home";
import { Routes, Route } from "react-router-dom";

function App() {

  return (
    <div className="h-screen w-screen bg-white">
      <Routes>
        <Route index element={<Home />} />
        <Route path="Smile" element={<Smile />} />
      </Routes>
    </div>
  );
}

export default App;
