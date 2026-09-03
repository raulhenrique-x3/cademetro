import { Injectable } from '@nestjs/common';

export interface ReliabilityConstants {
  weightAge: number;
  weightConf: number;
  weightTrust: number;
  confidenceAgeWindowMs: number;
  corroborationWindowMs: number;
}

export const DEFAULT_RELIABILITY_CONFIG: ReliabilityConstants = {
  weightAge: 0.40,
  weightConf: 0.35,
  weightTrust: 0.25,
  confidenceAgeWindowMs: 30 * 60 * 1000, // 30 minutes
  corroborationWindowMs: 5 * 60 * 1000,   // 5 minutes
};

@Injectable()
export class ReliabilityService {
  readonly config: ReliabilityConstants = DEFAULT_RELIABILITY_CONFIG;

  clamp(min: number, max: number, value: number): number {
    return Math.max(min, Math.min(max, value));
  }

  calculateFreshness(createdAt: Date | string, now: Date = new Date()): number {
    const createdMs = typeof createdAt === 'string' ? new Date(createdAt).getTime() : createdAt.getTime();
    const nowMs = now.getTime();
    const elapsedMs = Math.max(0, nowMs - createdMs);
    const score = 1 - elapsedMs / this.config.confidenceAgeWindowMs;
    return this.clamp(0, 1, score);
  }

  calculateConfirmationBalance(confirms: number, disputes: number): number {
    if (confirms === 0 && disputes === 0) {
      return 0.5;
    }
    const net = confirms - disputes;
    const denominator = 1 + confirms + disputes;
    if (denominator <= 0) return 0.5;
    return this.clamp(0, 1, (1 + net) / denominator);
  }

  calculateAuthorTrust(confirmedReceived: number, disputedReceived: number): number {
    const numerator = confirmedReceived + 1;
    const denominator = confirmedReceived + disputedReceived + 2;
    return this.clamp(0, 1, numerator / denominator);
  }

  calculateConfidence(params: {
    createdAt: Date | string;
    confirms: number;
    disputes: number;
    authorTrust?: number;
    now?: Date;
  }): number {
    const fAge = this.calculateFreshness(params.createdAt, params.now);
    const fConf = this.calculateConfirmationBalance(params.confirms, params.disputes);
    const fTrust = params.authorTrust ?? 0.5;

    const raw =
      this.config.weightAge * fAge +
      this.config.weightConf * fConf +
      this.config.weightTrust * fTrust;

    return Number(this.clamp(0, 1, raw).toFixed(4));
  }
}
