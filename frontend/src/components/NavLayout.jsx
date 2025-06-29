import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import GenNavbar from "./GenNavbar";

export default function NavLayout() {
  const location = useLocation();

  if (location.pathname === "/")
    return <Navbar />
  else
    if (location.pathname === "/auth") 
      return null;
    else  
    return <GenNavbar />
    
}
