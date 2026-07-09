import * as lucide from 'lucide-react';
console.log('Brand keys:', Object.keys(lucide).filter(k => {
  const l = k.toLowerCase();
  return l.includes('linkedin') || l.includes('facebook') || l.includes('twitter');
}));
