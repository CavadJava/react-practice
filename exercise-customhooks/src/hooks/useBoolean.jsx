import { useState } from "react";

export default function useBoolean(initialValue = false) {
  const [open, setOpen] = useState(initialValue);

  const onToggle = () => setOpen(!open);
  const onClose = () => setOpen(false);
  const onOpen = () => {setOpen(true)};

  return { open, onToggle, onClose, onOpen };
}