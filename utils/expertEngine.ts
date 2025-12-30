import { PriceColor, PillarConfig } from '../types';
import { LearningModule } from './LearningModule';

export interface Scene {
  buffer: number[];
  colors: PriceColor[];
  streak: number;
  digitWeight: number; 
  pattern: string;
  source: string; // New field to track Logic Pillar
  confidence: number; // 0 to 100
  decision: 'UP' | 'DOWN' | null;
  volatility: number;
}

export class ExpertEngine {
  private digitBuffer: number[] = [];
  private colorBuffer: PriceColor[] = [];
  private readonly bufferSize: number = 20;
  private learningModule: LearningModule;
  private config: PillarConfig = {
      cycling: true,
      pattern: true
  };

  constructor() {
      this.learningModule = new LearningModule();
  }

  public setConfig(config: PillarConfig) {
      this.config = config;
  }

  public pushTick(digit: number, color: PriceColor): void {
    this.digitBuffer.push(digit);
    this.colorBuffer.push(color);
    
    if (this.digitBuffer.length > this.bufferSize) {
      this.digitBuffer.shift();
      this.colorBuffer.shift();
    }
  }
  
  public reportResult(pattern: string, isWin: boolean) {
      this.learningModule.updateWeights(pattern, isWin);
  }

  // --- PILLAR 1: DIGIT CYCLING SYSTEM ---
  private checkCycling(currentDigit: number, currentColor: PriceColor): { decision: 'UP' | 'DOWN' | null, pattern: string } {
      if (this.digitBuffer.length < 5) return { decision: null, pattern: '' };

      // Find the last digit that had the SAME color and SAME parity
      const currentParity = currentDigit % 2;
      let prevDigit = -1;
      
      // Look backwards from current-1
      for (let i = this.digitBuffer.length - 2; i >= 0; i--) {
          const d = this.digitBuffer[i];
          const c = this.colorBuffer[i];
          if (c === currentColor && d % 2 === currentParity) {
              prevDigit = d;
              break;
          }
      }

      if (prevDigit === -1) return { decision: null, pattern: '' };

      // Calculate Step Direction (Handling modulo 10 wrap-around if needed, but linear for now as per examples)
      const isRising = currentDigit > prevDigit;
      const isFalling = currentDigit < prevDigit;
      const parityStr = currentParity === 0 ? "EVEN" : "ODD";
      const colorStr = currentColor === 'green' ? "GREEN" : "RED";

      // LOGIC RULES
      // Green + Rising -> UP
      // Green + Falling -> DOWN
      // Red + Rising -> DOWN
      // Red + Falling -> UP

      if (currentColor === 'green') {
          if (isRising) {
              return { decision: 'UP', pattern: `CYCLING: ${colorStr} ${parityStr} STEP UP` };
          } else if (isFalling) {
              return { decision: 'DOWN', pattern: `CYCLING: ${colorStr} ${parityStr} REVERSAL` };
          }
      } else { // RED
          if (isRising) {
               return { decision: 'DOWN', pattern: `CYCLING: ${colorStr} ${parityStr} STEP DOWN` };
          } else if (isFalling) {
               return { decision: 'UP', pattern: `CYCLING: ${colorStr} ${parityStr} REVERSAL` };
          }
      }

      return { decision: null, pattern: '' };
  }

  // --- PILLAR 2: PATTERNS MATCH SYSTEM ---
  private checkPatterns(): { decision: 'UP' | 'DOWN' | null, pattern: string } {
      if (this.digitBuffer.length < 4) return { decision: null, pattern: '' };
      
      const len = this.digitBuffer.length;
      const d1 = this.digitBuffer[len - 4]; // Tick -3
      const d2 = this.digitBuffer[len - 3]; // Tick -2
      const d3 = this.digitBuffer[len - 2]; // Tick -1
      const d4 = this.digitBuffer[len - 1]; // Current

      const c1 = this.colorBuffer[len - 4];
      const c2 = this.colorBuffer[len - 3];
      const c3 = this.colorBuffer[len - 2];
      const c4 = this.colorBuffer[len - 1];

      // Helpers
      const isOdd = (n: number) => n % 2 !== 0;
      const isEven = (n: number) => n % 2 === 0;
      const isStepUp = (a: number, b: number) => (b === a + 2) || (a === 9 && b === 1) || (a === 8 && b === 0);
      const isStepDown = (a: number, b: number) => (b === a - 2) || (a === 1 && b === 9) || (a === 0 && b === 8);

      // --- PATTERN LOGIC ---

      // 1. DOWN PATTERN A: Green Odd Step Up -> Red Even Step Up
      // Ex: 7->9 (Green/Odd), 6->8 (Red/Even)
      if (
          isOdd(d1) && isOdd(d2) && isStepUp(d1, d2) &&
          isEven(d3) && isEven(d4) && isStepUp(d3, d4) &&
          (c1 === 'green' || c2 === 'green') && (c3 === 'red' || c4 === 'red')
      ) {
          return { decision: 'DOWN', pattern: 'PATTERN: G-ODD-UP / R-EVEN-UP' };
      }

      // 2. UP PATTERN B: Red Odd Step Up -> Green Even Step Up
      // Ex: 1->3 (Red/Odd), 2->4 (Green/Even)
      if (
          isOdd(d1) && isOdd(d2) && isStepUp(d1, d2) &&
          isEven(d3) && isEven(d4) && isStepUp(d3, d4) &&
          (c1 === 'red' || c2 === 'red') && (c3 === 'green' || c4 === 'green')
      ) {
          return { decision: 'UP', pattern: 'PATTERN: R-ODD-UP / G-EVEN-UP' };
      }

      // 3. UP PATTERN C (Reversal): Red Odd Step Down -> Green Even Step Up
      // Ex: 3->1 (Red/Odd Falling), 2->4 (Green/Even Rising)
      if (
          isOdd(d1) && isOdd(d2) && isStepDown(d1, d2) &&
          isEven(d3) && isEven(d4) && isStepUp(d3, d4) &&
          (c1 === 'red' || c2 === 'red') && (c3 === 'green' || c4 === 'green')
      ) {
          return { decision: 'UP', pattern: 'PATTERN: R-ODD-REV / G-EVEN-UP' };
      }

      // 4. DOWN PATTERN D (Reversal): Green Even Step Down -> Red Odd Step Up
      // Ex: 2->0 (Green/Even Falling), 1->3 (Red/Odd Rising)
      if (
          isEven(d1) && isEven(d2) && isStepDown(d1, d2) &&
          isOdd(d3) && isOdd(d4) && isStepUp(d3, d4) &&
          (c1 === 'green' || c2 === 'green') && (c3 === 'red' || c4 === 'red')
      ) {
          return { decision: 'DOWN', pattern: 'PATTERN: G-EVEN-REV / R-ODD-UP' };
      }

      return { decision: null, pattern: '' };
  }

  public analyzeScene(): Scene | null {
    if (this.digitBuffer.length < 5) return null;

    const currentDigit = this.digitBuffer[this.digitBuffer.length - 1];
    const currentColor = this.colorBuffer[this.colorBuffer.length - 1];
    
    let decision: 'UP' | 'DOWN' | null = null;
    let pattern = "SCANNING...";
    let source = "NONE";
    let confidence = 0;
    
    // --- EVALUATE PILLARS ---
    
    // 1. Patterns (High Precision, High Priority)
    if (this.config.pattern) {
        const pResult = this.checkPatterns();
        if (pResult.decision) {
            decision = pResult.decision;
            pattern = pResult.pattern;
            source = "PATTERN";
            confidence = 90; // Base confidence for strict patterns
        }
    }

    // 2. Cycling (If no pattern found or pattern disabled)
    if (!decision && this.config.cycling) {
        const cResult = this.checkCycling(currentDigit, currentColor);
        if (cResult.decision) {
            decision = cResult.decision;
            pattern = cResult.pattern;
            source = "CYCLING";
            confidence = 80; // Base confidence for cycling
        }
    }

    // --- APPLY LEARNING ---
    if (decision && pattern !== "SCANNING...") {
        confidence = this.learningModule.applyLearning(pattern, confidence);
    }
    
    return {
      buffer: [...this.digitBuffer],
      colors: [...this.colorBuffer],
      streak: 0,
      digitWeight: 0,
      pattern,
      source,
      confidence: Math.min(confidence, 100),
      decision,
      volatility: 0
    };
  }
}