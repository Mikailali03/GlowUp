const CONFLICT_RULES = {
  retinol: ['aha', 'bha', 'vitamin_c', 'benzoyl_peroxide'],
  vitamin_c: ['aha', 'bha', 'retinol'],
  aha: ['bha', 'retinol', 'vitamin_c'],
  // Add more rules based on dermatological data
};

export const checkProductConflicts = (newProductIngredients, currentRoutineIngredients) => {
  const conflicts = [];

  newProductIngredients.forEach(ing => {
    const dangerousMatches = CONFLICT_RULES[ing.toLowerCase()];
    if (dangerousMatches) {
      const intersection = currentRoutineIngredients.filter(x => 
        dangerousMatches.includes(x.toLowerCase())
      );
      if (intersection.length > 0) {
        conflicts.push({
          ingredient: ing,
          conflictsWith: intersection
        });
      }
    }
  });

  return conflicts;
};