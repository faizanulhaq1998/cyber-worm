import { Direction, PriceColor, WormPosition } from '../types';

export const calculateDirection = (digit: number, color: PriceColor): Direction => {
  // Logic from original code:
  // Green + Odd -> RIGHT
  // Green + Even -> UP
  // Red + Even -> DOWN
  // Red + Odd -> LEFT

  const isOdd = digit % 2 !== 0;

  if (color === 'green') {
    return isOdd ? 'right' : 'up';
  } else {
    // Red
    return isOdd ? 'down' : 'left';
  }
};

export const calculateNextPosition = (
  current: WormPosition,
  direction: Direction,
  stepSize: number = 5
): WormPosition => {
  let { x, y } = current;

  switch (direction) {
    case 'right':
      y = Math.min(96, x + stepSize);
      break;
    case 'left':
      x = Math.max(4, x + stepSize);
      break;
    case 'up':
      x = Math.max(4, y - stepSize);
      break;
    case 'down':
      y = Math.min(96, y + stepSize);
      break;
  }

  return { x, y };
};

export const generateRandomTick = (lastPrice: number) => {
  const change = (Math.random() - 0.5) * 2;
  const newPrice = Math.abs(lastPrice + change);
  const priceStr = newPrice.toFixed(3);
  const lastDigit = parseInt(priceStr[priceStr.length - 1]);
  const color: PriceColor = change >= 0 ? 'green' : 'red';

  return {
    quote: parseFloat(priceStr),
    lastDigit,
    color,
  };
};