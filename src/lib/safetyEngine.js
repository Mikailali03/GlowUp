const CONFLICT_MAP = {
  'Retinol': ['BHA', 'AHA', 'Vitamin C', 'Benzoyl Peroxide'],
  'Vitamin C': ['BHA', 'AHA', 'Retinol'],
  'BHA': ['Retinol', 'Vitamin C'],
  'AHA': ['Retinol', 'Vitamin C']
};

export const checkConflicts = (newProduct, existingRoutine) => {
  const newActives = newProduct.actives || [];
  let conflictsFound = [];

  existingRoutine.forEach(item => {
    item.actives.forEach(existingActive => {
      newActives.forEach(newActive => {
        if (CONFLICT_MAP[newActive]?.includes(existingActive)) {
          conflictsFound.push({
            newActive,
            existingActive,
            existingProductName: item.name
          });
        }
      });
    });
  });

  return conflictsFound;
};