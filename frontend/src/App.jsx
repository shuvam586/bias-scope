import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import SkewPage from "./pages/SkewPage";
import SourcesPage from "./pages/SourcesPage";
import SourcePage from "./pages/SourcePage";
import EventPage from "./pages/EventPage";

function App() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    if (pathname.startsWith("/event")) {
      document.body.className = "page-event";
    } else if (pathname.startsWith("/sources")) {
      document.body.className = "page-sources";
    } else if (pathname.startsWith("/source")) {
      document.body.className = "page-source";
    } else {
      document.body.className = "page-home";
    }
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/theskew" element={<SkewPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/event/:eventid" element={<EventPage />} />
        <Route path="/source/:sourceid" element={<SourcePage />} />
      </Routes>
      <Footer />
      <Analytics />
    </>
  );
}

export default App;
