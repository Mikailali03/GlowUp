import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkConflicts } from '../lib/safetyEngine';

const RoutineContext = createContext();

export const RoutineProvider = ({ children }) => {
  // The user's active routine
  const [myRoutine, setMyRoutine] = useState([]);
  // Current recommendations from the quiz
  const [recommendations, setRecommendations] = useState([]);
  
  // Logic to add a product with conflict checking
  const addToRoutine = (product, force = false) => {
    const conflicts = checkConflicts(product, myRoutine);

    if (conflicts.length > 0 && !force) {
      return { success: false, conflicts };
    }

    setMyRoutine(prev => [...prev, product]);
    // Remove from recommendations list once added
    setRecommendations(prev => prev.filter(p => p.id !== product.id));
    return { success: true };
  };

  const removeFromRoutine = (productId) => {
    setMyRoutine(prev => prev.filter(p => p.id !== productId));
  };

  return (
    <RoutineContext.Provider value={{ 
      myRoutine, 
      recommendations, 
      setRecommendations, 
      addToRoutine, 
      removeFromRoutine 
    }}>
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutine = () => useContext(RoutineContext);