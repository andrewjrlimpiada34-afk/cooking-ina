
"use client"

import { useState, useCallback } from 'react';

const COMMON_INGREDIENTS = [
  'Chicken Breast', 'Garlic', 'Onion', 'Tomato', 'Spinach', 
  'Potato', 'Carrot', 'Egg', 'Milk', 'Cheese', 'Butter', 
  'Olive Oil', 'Rice', 'Pasta', 'Beef', 'Pork', 'Fish', 
  'Soy Sauce', 'Vinegar', 'Ginger', 'Chili', 'Lime', 'Coconut Milk',
  'Salt', 'Black Pepper', 'Sugar', 'Flour', 'Bread', 'Mushrooms',
  'Calamansi', 'Shrimp', 'Corn', 'Peas', 'Broccoli', 'Bell Pepper'
];

export function useIngredients() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addIngredient = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      setIngredients(prev => [...prev, trimmed]);
      setInputValue('');
    }
  }, [ingredients]);

  const removeIngredient = useCallback((name: string) => {
    setIngredients(prev => prev.filter(i => i !== name));
  }, []);

  const suggestions = COMMON_INGREDIENTS.filter(item => 
    item.toLowerCase().includes(inputValue.toLowerCase()) && 
    !ingredients.includes(item)
  ).slice(0, 5);

  return {
    ingredients,
    setIngredients,
    inputValue,
    setInputValue,
    addIngredient,
    removeIngredient,
    suggestions
  };
}
