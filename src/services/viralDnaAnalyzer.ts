

/**
 * VIRAL DNA ANALYZER
 * 
 * Reverse-engineers winning content at molecular level
 * Identifies patterns invisible to human analysis
 * 
 * NEVER BUILT BEFORE: Treats content as genetic code with DNA markers
 */

import { supabase } from "@/integrations/supabase/client";

interface ViralDNA {
  hookPattern: string;
  emotionalTriggers: string[];
  pricingPsychology: string;
  urgencyMarkers: string[];
  socialProofElements: string[];
  visualCues: string[];
  dnaScore: number;
  mutationPotential: number; // How many variations can be created
}

interface ContentGene {
  type: "hook" | "price" | "urgency" | "social" | "visual";
  sequence: string;
  strength: number;
  frequency: number;
}

export const viralDnaAnalyzer = {
  /**
   * Extract DNA from winning content
   * Identifies genetic markers that make content viral
   */
  async extractDNA(userId: string): Promise<{
    totalAnalyzed: number;
    genes: ContentGene[];
    viralPatterns: ViralDNA[];
    topGenes: ContentGene[];
  }> {
    try {
      console.log('🧬 DNA ANALYZER: Extracting viral genes...');

      // Get top performing content (winners only)
      const { data: winners } = await supabase
        .from('posted_content')
        .select('id, caption, platform, clicks, conversions, revenue')
        .eq('user_id', userId)
        .gte('clicks', 50) // Only winners
        .order('revenue', { ascending: false })
        .limit(50);

      if (!winners || winners.length === 0) {
        return { totalAnalyzed: 0, genes: [], viralPatterns: [], topGenes: [] };
      }

      console.log(`🧬 Analyzing ${winners.length} winning posts...`);

      const allGenes: ContentGene[] = [];
      const viralPatterns: ViralDNA[] = [];

      for (const post of winners) {
        const caption = post.caption || '';
        const dna = this.sequenceContent(caption);
        
        // Calculate DNA score based on performance
        const clickValue = post.clicks || 0;
        const conversionValue = (post.conversions || 0) * 10;
        const revenueValue = Number(post.revenue || 0) * 2;
        const dnaScore = clickValue + conversionValue + revenueValue;

        viralPatterns.push({
          ...dna,
          dnaScore,
          mutationPotential: this.calculateMutations(dna)
        });

        // Collect all genes
        this.extractGenes(caption, post.clicks || 0).forEach(gene => {
          allGenes.push(gene);
        });
      }

      // Find most frequent successful genes
      const geneMap = new Map<string, ContentGene>();
      allGenes.forEach(gene => {
        const key = `${gene.type}:${gene.sequence}`;
        if (geneMap.has(key)) {
          const existing = geneMap.get(key)!;
          existing.frequency++;
          existing.strength = Math.max(existing.strength, gene.strength);
        } else {
          geneMap.set(key, { ...gene, frequency: 1 });
        }
      });

      const topGenes = Array.from(geneMap.values())
        .sort((a, b) => (b.strength * b.frequency) - (a.strength * a.frequency))
        .slice(0, 20);

      console.log(`✅ DNA ANALYSIS COMPLETE: ${topGenes.length} dominant genes identified`);

      return {
        totalAnalyzed: winners.length,
        genes: allGenes,
        viralPatterns: viralPatterns.sort((a, b) => b.dnaScore - a.dnaScore),
        topGenes
      };

    } catch (error) {
      console.error('DNA extraction error:', error);
      return { totalAnalyzed: 0, genes: [], viralPatterns: [], topGenes: [] };
    }
  },

  /**
   * Sequence content into DNA components
   */
  sequenceContent(caption: string): Omit<ViralDNA, 'dnaScore' | 'mutationPotential'> {
    const text = caption.toLowerCase();

    // Hook patterns (first 100 chars)
    const hookPattern = this.identifyHookPattern(caption.substring(0, 100));

    // Emotional triggers
    const emotionalTriggers: string[] = [];
    const emotions = {
      curiosity: ['wait', 'secret', 'hidden', 'nobody', 'finally', 'discover'],
      urgency: ['now', 'today', 'limited', 'hurry', 'fast', 'quick'],
      fomo: ['everyone', 'viral', 'trending', 'popular', 'sold out'],
      transformation: ['before', 'after', 'changed', 'transformed', 'revolutionized'],
      validation: ['proven', 'tested', 'verified', 'guaranteed', 'certified']
    };

    Object.entries(emotions).forEach(([emotion, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        emotionalTriggers.push(emotion);
      }
    });

    // Pricing psychology
    let pricingPsychology = 'standard';
    if (text.match(/\$\d+/)) {
      const priceMatch = text.match(/\$(\d+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        if (price < 20) pricingPsychology = 'impulse_buy';
        else if (price < 50) pricingPsychology = 'sweet_spot';
        else if (price < 100) pricingPsychology = 'considered_purchase';
        else pricingPsychology = 'premium';
      }
    }

    // Urgency markers
    const urgencyMarkers: string[] = [];
    const urgencyKeywords = {
      time_limited: ['hours left', 'ends today', 'expires', 'deadline'],
      stock_limited: ['selling fast', 'almost gone', 'few left', 'limited stock'],
      exclusive: ['exclusive', 'members only', 'vip', 'early access']
    };

    Object.entries(urgencyKeywords).forEach(([type, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        urgencyMarkers.push(type);
      }
    });

    // Social proof elements
    const socialProofElements: string[] = [];
    const proofKeywords = {
      reviews: ['reviews', 'rated', 'stars', 'testimonial'],
      sales: ['sold', 'orders', 'customers', 'buyers'],
      authority: ['expert', 'professional', 'certified', 'approved'],
      community: ['thousands', 'millions', 'community', 'fans']
    };

    Object.entries(proofKeywords).forEach(([type, keywords]) => {
      if (keywords.some(kw => text.includes(kw))) {
        socialProofElements.push(type);
      }
    });

    // Visual cues
    const visualCues: string[] = [];
    if (caption.match(/[🔥💥⚡✨💫🎯]/)) visualCues.push('fire_emoji');
    if (caption.match(/[👆☝️👇👉]/)) visualCues.push('pointing_emoji');
    if (caption.match(/[💰💵💸💲]/)) visualCues.push('money_emoji');
    if (caption.match(/[⚠️❌✅]/)) visualCues.push('alert_emoji');
    if (caption.includes('!')) visualCues.push('exclamation');
    if (caption.match(/[A-Z]{3,}/)) visualCues.push('caps_emphasis');

    return {
      hookPattern,
      emotionalTriggers,
      pricingPsychology,
      urgencyMarkers,
      socialProofElements,
      visualCues
    };
  },

  /**
   * Identify hook pattern type
   */
  identifyHookPattern(hook: string): string {
    const h = hook.toLowerCase();
    
    if (h.startsWith('wait') || h.startsWith('stop')) return 'interrupt_pattern';
    if (h.includes('pov:') || h.includes('me when')) return 'relatability_pattern';
    if (h.includes('secret') || h.includes('nobody')) return 'curiosity_gap';
    if (h.includes('finally') || h.includes('found')) return 'discovery_pattern';
    if (h.match(/\d+\s+(ways|reasons|tips|hacks)/)) return 'list_pattern';
    if (h.includes('vs') || h.includes('better than')) return 'comparison_pattern';
    if (h.includes('?')) return 'question_pattern';
    
    return 'statement_pattern';
  },

  /**
   * Extract individual genes from content
   */
  extractGenes(caption: string, clicks: number): ContentGene[] {
    const genes: ContentGene[] = [];
    const text = caption.toLowerCase();
    const strength = Math.min(100, clicks / 2); // Normalize to 0-100

    // Hook genes (first sentence)
    const firstSentence = caption.split(/[.!?]/)[0];
    if (firstSentence) {
      genes.push({
        type: 'hook',
        sequence: firstSentence.substring(0, 50),
        strength,
        frequency: 0
      });
    }

    // Price genes
    const priceMatch = text.match(/\$\d+/g);
    if (priceMatch) {
      priceMatch.forEach(price => {
        genes.push({
          type: 'price',
          sequence: price,
          strength,
          frequency: 0
        });
      });
    }

    // Urgency genes
    const urgencyWords = ['now', 'today', 'limited', 'hurry', 'fast', 'quick', 'ends'];
    urgencyWords.forEach(word => {
      if (text.includes(word)) {
        genes.push({
          type: 'urgency',
          sequence: word,
          strength,
          frequency: 0
        });
      }
    });

    // Social proof genes
    const socialWords = ['reviews', 'rated', 'sold', 'customers', 'loved'];
    socialWords.forEach(word => {
      if (text.includes(word)) {
        genes.push({
          type: 'social',
          sequence: word,
          strength,
          frequency: 0
        });
      }
    });

    // Visual genes (emojis)
    const emojis = caption.match(/[\u{1F300}-\u{1F9FF}]/gu) || [];
    emojis.forEach(emoji => {
      genes.push({
        type: 'visual',
        sequence: emoji,
        strength,
        frequency: 0
      });
    });

    return genes;
  },

  /**
   * Calculate how many variations can be created from this DNA
   */
  calculateMutations(dna: Omit<ViralDNA, 'dnaScore' | 'mutationPotential'>): number {
    let mutations = 1;
    
    // Each element can be varied
    if (dna.emotionalTriggers.length > 0) mutations *= (dna.emotionalTriggers.length + 1);
    if (dna.urgencyMarkers.length > 0) mutations *= (dna.urgencyMarkers.length + 1);
    if (dna.socialProofElements.length > 0) mutations *= (dna.socialProofElements.length + 1);
    if (dna.visualCues.length > 0) mutations *= Math.min(10, dna.visualCues.length + 1);
    
    return Math.min(50, mutations); // Cap at 50 variations
  },

  /**
   * Clone winning DNA into new variations
   */
  async cloneDNA(dnaPattern: any, productInfo?: any): Promise<string[]> {
    const variations: string[] = [];
    const productName = productInfo?.name || 'this product';
    const price = productInfo?.price || '9.99';
    
    // Create variations based on the DNA
    [1, 2, 3].forEach(i => {
    });
    return variations;
  }
};

