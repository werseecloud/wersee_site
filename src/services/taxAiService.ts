import { supabase, invokeApiRunner } from '../lib/supabase';

export interface TaxAnalysisRequest {
  revenue: number;
  stripeFees: number;
  werseeFees: number;
  country: string;
  region: string;
  transactions: any[];
}

export interface TaxAnalysisResponse {
  vatRate: number;
  vatAmount: number;
  netProfit: number;
  taxReserve: number;
  ossStatus: {
    thresholdReached: boolean;
    currentAmount: number;
    limit: number;
  };
  nexusStatus: {
    hasNexus: boolean;
    states: string[];
  };
  summary: string;
}

export async function analyzeTaxes(data: TaxAnalysisRequest): Promise<TaxAnalysisResponse> {
  try {
    const responseData = await invokeApiRunner('tax-analyze', data);
    return responseData;
  } catch (error) {
    console.error("Tax AI Error:", error);
    // Fallback if backend fails
    const vatRate = data.country === 'NL' ? 0.21 : 0.20;
    const vatAmount = data.revenue * vatRate;
    const netProfit = data.revenue - data.stripeFees - data.werseeFees - vatAmount;
    
    return {
      vatRate,
      vatAmount,
      netProfit,
      taxReserve: vatAmount,
      ossStatus: {
        thresholdReached: data.revenue > 10000,
        currentAmount: data.revenue,
        limit: 10000
      },
      nexusStatus: {
        hasNexus: false,
        states: []
      },
      summary: "AI Assistant is currently in fallback mode. Calculated based on standard rates for " + data.country
    };
  }
}
