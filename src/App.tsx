import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { CreatePass } from "./pages/CreatePass";
import { MyPasses } from "./pages/MyPasses";
import { RedeemPass } from "./pages/RedeemPass";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"home" | "create" | "my-passes" | "redeem">(
    "home"
  );

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative selection:bg-cyan-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none glow-ambient"></div>
      <div className="fixed bottom-10 right-1/4 w-[30rem] h-[30rem] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none glow-ambient"></div>

      {/* Top Navigation */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {currentTab === "home" && <Home setCurrentTab={setCurrentTab} />}
        {currentTab === "create" && <CreatePass />}
        {currentTab === "my-passes" && <MyPasses />}
        {currentTab === "redeem" && <RedeemPass />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;

