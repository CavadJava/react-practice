
import { useState } from 'react';


export const useBoolean = () => {

  const [open, setOpen] = useState(false);
  
  const setToggle = () => setOpen(!open); 
  
  const setOpenTrue = () => setOpen(true);
  
  const setOpenFalse = () => setOpen(false);

  return { open, setToggle, setOpenTrue, setOpenFalse };

}