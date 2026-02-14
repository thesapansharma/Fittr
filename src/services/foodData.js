export const foodCalories = {
  samosa: 250,
  paratha: 280,
  'cold drink': 150,
  'white rice': 210,
  roti: 120,
  salad: 80,
  dal: 180,
  paneer: 270,
  idli: 65,
  poha: 220,
  upma: 240,
  banana: 90,
  egg: 80
};

export const foodSwaps = [
  {
    trigger: ['samosa', 'pakoda', 'fried snack'],
    suggestions: ['roasted chana', 'peanuts', 'boiled corn']
  },
  {
    trigger: ['cold drink', 'cola', 'soda'],
    suggestions: ['lemon water', 'coconut water', 'buttermilk']
  },
  {
    trigger: ['paratha', 'butter paratha'],
    suggestions: ['plain roti', 'multigrain roti']
  },
  {
    trigger: ['white rice', 'extra rice'],
    suggestions: ['half rice + salad', 'dal + vegetables']
  }
];
