import { RECOMMENDED_PRODUCTS } from './products';

export const generateRoutineFromQuiz = (quizResults) => {
  const { skin_type, concerns, has_beard } = quizResults;
  
  return RECOMMENDED_PRODUCTS.filter(product => {
    const matchSkin = product.suitable_for.includes(skin_type);
    const matchConcern = product.suitable_for.some(trait => concerns.includes(trait));
    
    // Always include cleansers/moisturizers, but filter treatments by concern
    if (product.category === 'cleanser') return matchSkin;
    return matchSkin || matchConcern;
  });
};