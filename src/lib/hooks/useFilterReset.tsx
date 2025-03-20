// Used to reset the filters in the marketplace by creating a publisher/subscriber
// relationship.

import React from "react";

let listeners: (() => void)[] = [];
let count = 0;

// Publisher
export function useTriggerFilterReset() {
  count++;
  listeners.forEach(listener => listener());
}

// Subscriber
export function useFilterReset() {
  const [resetCount, setResetCount] = React.useState(count);
  
  React.useEffect(() => {
    const handleReset = () => setResetCount(count);
    listeners.push(handleReset);
  }, []);
  
  return resetCount;
}