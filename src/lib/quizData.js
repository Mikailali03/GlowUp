export const quizQuestions = [
  {
    id: 'sex',
    question: "What is your biological sex?",
    type: 'single',
    options: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
      { label: "Other", value: "other" }
    ]
  },
  {
    id: 'age',
    question: "How old are you?",
    type: 'number', // We'll handle this with a slider or input
  },
  {
    id: 'skin_type',
    question: "How would you describe your skin?",
    type: 'single',
    options: [
      { label: "Oily", value: "oily" },
      { label: "Dry", value: "dry" },
      { label: "Sensitive", value: "sensitive" },
      { label: "Combination", value: "combination" }
    ]
  },
  {
    id: 'concerns',
    question: "What are your primary skin concerns?",
    type: 'multiple', // Multi-select enabled
    options: [
      { label: "Acne", value: "acne" },
      { label: "Aging/Fine Lines", value: "aging" },
      { label: "Dark Spots", value: "pigmentation" },
      { label: "Redness/Rosacea", value: "redness" },
      { label: "Dark Circles", value: "circles" }
    ]
  },
  {
    id: 'facial_hair',
    question: "Do you have facial hair to maintain?",
    type: 'single',
    options: [
      { label: "Yes, full beard", value: "full_beard" },
      { label: "Yes, scruff/stubble", value: "stubble" },
      { label: "No", value: "none" }
    ]
  }
];