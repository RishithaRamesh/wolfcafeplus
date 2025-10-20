import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    axios.get("/api").then(res => setMsg(res.data.message));
  }, []);

  return (
    <div className="App">
      <h1>☕ WolfCafe+</h1>
      <p>{msg}</p>
    </div>
  );
}

export default App;
