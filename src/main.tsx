import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { startSyncEngine } from "@/lib/syncEngine";
import { installZoomLock } from "@/lib/zoomLock";

installZoomLock();
startSyncEngine();

createRoot(document.getElementById("root")!).render(<App />);
