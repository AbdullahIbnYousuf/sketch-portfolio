import { createContext, useContext } from 'react';

// Nested room objects must not react to pointer events during preparation.
export const RoomActivityContext = createContext(true);
export const useRoomActivity = () => useContext(RoomActivityContext);
