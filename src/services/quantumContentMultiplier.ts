

/**
 * QUANTUM CONTENT MULTIPLIER
 * 
 * Creates infinite variations from 1 winning post
 * Uses quantum superposition: one post exists in multiple forms simultaneously
 * 
 * NEVER BUILT BEFORE: Content exists in superposition until platform "observes" it
 */

import { supabase } from "@/integrations/supabase/client";

interface ContentParticle {
  hook: string;
  body: string;
  cta: string;
  emojis: string[];
  hashtags: string[];
}

interface QuantumState {
  originalId: string;
  particles: ContentParticle[];
  superpositions: number; // How many forms it can take
  platform: string;
  energy: number; // Performance score
}

export const quantumContentMultiplier = {
  /**
   * Put content into quantum superposition
   * One post becomes many without creating duplicates
   */
  async createSuperposition(userId: string, postId: string): Promise<{
    success: boolean;
    variations: number;
    quantumStates: string[];
  }> {
    try {
      console.log('⚛️ QUANTUM: Creating superposition...');

      // Get original winning post
      const { data: original } = await supabase
        .from('posted_content')
        .select('*, affiliate_links(product_name, price)')
        .eq('id', postId)
        .single();

      if (!original) {
        return { success: false, variations: 0, quantumStates: [] };
      }

      const caption = original.caption || '';
      
      // Split into quantum particles
      const particles = this.decomposeIntoParticles(caption);
      
      // Create variations through quantum entanglement
      const variations = this.entangleParticles(particles, original.platform);

      console.log(`⚛️ Created ${variations.length} quantum states`);

      return {
        success: true,
        variations: variations.length,
        quantumStates: variations
      };

    } catch (error) {
      console.error('Quantum superposition error:', error);
      return { success: false, variations: 0, quantumStates: [] };
    }
  },

  /**
   * Decompose content into quantum particles
   */
  decomposeIntoParticles(caption: string): ContentParticle[] {
    const particles: ContentParticle[] = [];
    
    // Split caption into components
    const lines = caption.split('\n').filter(l => l.trim());
    
    // Extract hook (first line/sentence)
    const hook = lines[0] || caption.substring(0, 100);
    
    // Extract body (middle content)
    const body = lines.slice(1, -1).join('\n') || '';
    
    // Extract CTA (last line)
    const cta = lines[lines.length - 1] || 'Check it out!';
    
    // Extract emojis
    const emojis = caption.match(/[\u{1F300}-\u{1F9FF}]/gu) || [];
    
    // Extract hashtags
    const hashtags = caption.match(/#\w+/g) || [];

    particles.push({
      hook: hook.replace(/[#@]/g, '').trim(),
      body: body.replace(/[#@]/g, '').trim(),
      cta: cta.replace(/[#@]/g, '').trim(),
      emojis: [...new Set(emojis)],
      hashtags: [...new Set(hashtags)]
    });

    return particles;
  },

  /**
   * Quantum entanglement: create variations
   */
  entangleParticles(particles: ContentParticle[], platform: string): string[] {
    const variations: string[] = [];

    if (particles.length === 0) return variations;

    const particle = particles[0];

    // Hook variations (quantum spin)
    const hookSpins = this.spinHook(particle.hook, platform);
    
    // Body variations (quantum oscillation)
    const bodyOscillations = this.oscillateBody(particle.body);
    
    // CTA variations (quantum tunneling)
    const ctaTunnels = this.tunnelCTA(particle.cta, platform);
    
    // Emoji variations (quantum superposition)
    const emojiStates = this.superposeEmojis(particle.emojis);

    // Create all possible combinations (quantum entanglement)
    for (let h = 0; h < Math.min(3, hookSpins.length); h++) {
      for (let b = 0; b < Math.min(2, bodyOscillations.length); b++) {
        for (let c = 0; c < Math.min(2, ctaTunnels.length); c++) {
          for (let e = 0; e < Math.min(2, emojiStates.length); e++) {
            const variation = [
              emojiStates[e] + ' ' + hookSpins[h],
              bodyOscillations[b],
              ctaTunnels[c],
              particle.hashtags.slice(0, 5).join(' ')
            ].filter(Boolean).join('\n\n');

            variations.push(variation);
          }
        }
      }
    }

    return variations.slice(0, 25); // Cap at 25 variations
  },

  /**
   * Spin hook into different quantum states
   */
  spinHook(hook: string, platform: string): string[] {
    const spins: string[] = [hook]; // Original state

    // Platform-specific spin patterns
    const spinPatterns = {
      tiktok: [
        'POV: ' + hook.toLowerCase(),
        '🚨 ' + hook,
        hook + ' (wait for it)',
        'WATCH THIS: ' + hook
      ],
      instagram: [
        '✨ ' + hook,
        hook + ' 📸',
        'THE TRUTH: ' + hook,
        hook + ' (swipe for details)'
      ],
      pinterest: [
        '📌 ' + hook,
        hook + ' - PIN THIS!',
        'MUST SEE: ' + hook,
        hook + ' [SAVE FOR LATER]'
      ]
    };

    const patterns = spinPatterns[platform as keyof typeof spinPatterns] || spinPatterns.tiktok;
    spins.push(...patterns);

    return spins.filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  },

  /**
   * Oscillate body content
   */
  oscillateBody(body: string): string[] {
    if (!body) return [''];

    const oscillations: string[] = [body];

    // Add intensity variations
    oscillations.push(
      body + '\n\nSeriously, this changed everything.',
      body + '\n\nYou need to see this!',
      body + '\n\nNo joke, this is game-changing.'
    );

    return oscillations;
  },

  /**
   * Tunnel CTA through quantum barriers
   */
  tunnelCTA(cta: string, platform: string): string[] {
    const tunnels: string[] = [cta];

    const platformCTAs = {
      tiktok: [
        'Link in bio! 👆',
        'Get yours now! (link above)',
        'Click the link! ⬆️',
        'Tap bio for link 🔗'
      ],
      instagram: [
        'Link in bio ✨',
        'Tap the link in bio 📲',
        'Get it here (link in bio) 🔗',
        'Shop the link in my bio! 💫'
      ],
      pinterest: [
        'Click to shop! 📌',
        'Pin & shop now!',
        'Save this pin! 💕',
        'Shop here → (click pin)'
      ]
    };

    const ctas = platformCTAs[platform as keyof typeof platformCTAs] || platformCTAs.tiktok;
    tunnels.push(...ctas);

    return tunnels;
  },

  /**
   * Superpose emojis across quantum states
   */
  superposeEmojis(emojis: string[]): string[] {
    if (emojis.length === 0) {
      return ['🔥', '⚡', '✨', '💫', '🚀'];
    }

    const states: string[] = [];

    // Single emoji states
    emojis.forEach(e => states.push(e));

    // Combo states (2 emojis)
    if (emojis.length >= 2) {
      states.push(emojis[0] + emojis[1]);
      states.push(emojis[1] + emojis[0]);
    }

    // Triple states
    if (emojis.length >= 3) {
      states.push(emojis[0] + emojis[1] + emojis[2]);
    }

    return states.slice(0, 5);
  },

  /**
   * Collapse quantum state for specific platform
   * When observed (posted), superposition collapses to one state
   */
  async collapseState(
    quantumStates: string[],
    platform: string,
    targetAudience: 'warm' | 'cold'
  ): Promise<string> {
    // Observer effect: platform + audience determines which state manifests
    
    if (targetAudience === 'warm') {
      // For warm audience, use softer hooks
      return quantumStates.find(s => !s.includes('🚨') && !s.includes('WATCH')) || quantumStates[0];
    } else {
      // For cold audience, use attention-grabbing hooks
      return quantumStates.find(s => s.includes('🚨') || s.includes('WATCH') || s.includes('🔥')) || quantumStates[0];
    }
  },

  /**
   * Measure quantum energy (predicted performance)
   */
  measureEnergy(quantumState: string, historicalData: any[]): number {
    let energy = 50; // Base energy

    // Check for high-energy particles
    const highEnergy = ['🚨', '🔥', '⚡', 'WAIT', 'STOP', 'SECRET', 'VIRAL'];
    highEnergy.forEach(particle => {
      if (quantumState.includes(particle)) energy += 10;
    });

    // Historical resonance
    if (historicalData.length > 0) {
      const avgClicks = historicalData.reduce((sum, d) => sum + (d.clicks || 0), 0) / historicalData.length;
      energy += Math.min(30, avgClicks / 10);
    }

    return Math.min(100, energy);
  }
};

