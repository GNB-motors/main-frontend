import { useEffect, useState } from 'react';
import { formatInIST } from '../../utils/dateUtils';

const istNow = () => `${formatInIST(new Date(), 'hh:mm a')} IST`;

/** Topbar IST clock. Owns its 15 s tick so only the clock re-renders, not the page. */
export default function LiveClock() {
  const [text, setText] = useState(istNow);
  useEffect(() => {
    const timer = setInterval(() => setText(istNow()), 15000);
    return () => clearInterval(timer);
  }, []);
  return <span>{text}</span>;
}
