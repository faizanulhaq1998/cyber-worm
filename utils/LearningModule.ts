export class LearningModule {
  private sceneWeights: Record<string, number>;

  constructor() {
    // Initialize weights for patterns
    this.sceneWeights = {
      // Cycling Patterns
      "CYCLING: GREEN EVEN STEP UP": 1.0,
      "CYCLING: GREEN ODD STEP UP": 1.0,
      "CYCLING: RED EVEN STEP DOWN": 1.0,
      "CYCLING: RED ODD STEP DOWN": 1.0,
      "CYCLING: GREEN EVEN REVERSAL": 1.0,
      "CYCLING: RED ODD REVERSAL": 1.0,
      
      // Strict Patterns
      "PATTERN: G-ODD-UP / R-EVEN-UP": 1.0,
      "PATTERN: R-ODD-UP / G-EVEN-UP": 1.0,
      "PATTERN: R-ODD-REV / G-EVEN-UP": 1.0,
      "PATTERN: G-EVEN-REV / R-ODD-UP": 1.0
    };
  }

  public updateWeights(pattern: string, isWin: boolean): void {
    if (!pattern || pattern === 'SCANNING...' || pattern === 'NEUTRAL') return;

    // Retrieve current weight or default to 1.0
    const currentWeight = this.sceneWeights[pattern] || 1.0;
    
    // Adjust weight: +0.1 for win, -0.1 for loss
    // We cap it between 0.2 (min influence) and 3.0 (high dominance)
    const adjustment = isWin ? 0.1 : -0.1;
    const newWeight = Math.min(Math.max(currentWeight + adjustment, 0.2), 3.0);
    
    this.sceneWeights[pattern] = newWeight;
    console.log(`[Learning AI] Pillar "${pattern}" updated. Result: ${isWin ? 'WIN' : 'LOSS'} | New Weight: ${newWeight.toFixed(2)}`);
  }

  public applyLearning(pattern: string, confidence: number): number {
    const weight = this.sceneWeights[pattern] ?? 1.0;
    const adjustedConfidence = confidence * weight;
    return Math.min(adjustedConfidence, 100);
  }
  
  public getWeight(pattern: string): number {
      return this.sceneWeights[pattern] ?? 1.0;
  }
}