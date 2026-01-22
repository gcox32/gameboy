import { MemoryWatcherConfig } from '@/types/states';

export interface ScanResult {
    success: boolean;
    config: MemoryWatcherConfig | null;
    confidence: 'high' | 'medium' | 'low';
    details: string;
    candidates?: ScanCandidate[];
}

export interface ScanCandidate {
    address: string;
    confidence: 'high' | 'medium' | 'low';
    preview: string;
    score: number;
}

// Valid Pokemon species IDs
const GEN1_MAX_SPECIES = 151;
const GEN2_MAX_SPECIES = 251;

// Common map IDs that indicate valid location data
const VALID_GEN1_MAP_IDS = new Set([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, // Pallet, Viridian, etc.
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    // ... up to ~248 for Gen 1
]);

/**
 * Scan memory for party data structure
 * Party structure: [count (1-6)][species1-6][0xFF padding][pokemon data...]
 */
export async function scanForPartyData(
    memory: number[],
    generation: 1 | 2 = 1,
    onProgress?: (progress: number, message: string) => void
): Promise<ScanResult> {
    const candidates: ScanCandidate[] = [];
    const maxSpecies = generation === 1 ? GEN1_MAX_SPECIES : GEN2_MAX_SPECIES;
    const pokemonDataSize = generation === 1 ? 44 : 48;
    const expectedSize = generation === 1 ? 0x195 : 0x1A0;

    // Search in WRAM area (0xC000-0xDFFF) where party data typically lives
    const searchStart = 0xC000;
    const searchEnd = 0xE000;
    const totalAddresses = searchEnd - searchStart;

    // Check if memory is populated
    if (!memory || memory.length < searchEnd) {
        console.error('[MemoryScanner] Insufficient memory data:', {
            memoryExists: !!memory,
            memoryLength: memory?.length ?? 0,
            required: searchEnd,
        });
        return {
            success: false,
            config: null,
            confidence: 'low',
            details: `Memory data not available (length: ${memory?.length ?? 0}, need: ${searchEnd}). Make sure a game is actively running.`,
            candidates: [],
        };
    }

    // Debug: Log memory info and expected address data
    const expectedAddr = generation === 1 ? 0xD163 : 0xDCD7;
    console.log('[MemoryScanner] Scan started:', {
        generation,
        memoryLength: memory.length,
        searchRange: `0x${searchStart.toString(16)}-0x${searchEnd.toString(16)}`,
        expectedPartyAddr: `0x${expectedAddr.toString(16)}`,
        dataAtExpectedAddr: memory[expectedAddr] !== undefined
            ? `count=${memory[expectedAddr]}, species=[${Array.from(memory.slice(expectedAddr + 1, expectedAddr + 7)).join(', ')}]`
            : 'undefined',
    });

    onProgress?.(0, 'Initializing memory scan...');

    for (let addr = searchStart; addr < searchEnd; addr++) {
        // Progress update more frequently for better feedback (every 100 addresses)
        if ((addr - searchStart) % 100 === 0) {
            const progress = ((addr - searchStart) / totalAddresses) * 100;
            const addrHex = addr.toString(16).toUpperCase().padStart(4, '0');
            onProgress?.(progress, `Scanning 0x${addrHex}...`);
            
            // Add small delay to slow down scan and allow UI to update smoothly
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        const count = memory[addr];

        // Party count must be 1-6
        if (count < 1 || count > 6) continue;

        // Check species IDs - the species list is 6 bytes (positions 1-6)
        // Structure: [species1]...[speciesN][0xFF terminator][0xFF...][0xFF]
        // So if count=3: positions 1-3 have species, position 4 has 0xFF terminator, positions 5-6 are 0xFF
        let validSpecies = true;
        const speciesList: number[] = [];

        // Check used species slots (1 to count)
        for (let i = 1; i <= count; i++) {
            const species = memory[addr + i];
            if (species < 1 || species > maxSpecies) {
                validSpecies = false;
                break;
            }
            speciesList.push(species);
        }

        if (!validSpecies) continue;

        // Check terminator at position count + 1
        // The terminator should be 0xFF, but we'll be lenient and also accept 0x00
        const terminatorPos = addr + count + 1;
        if (terminatorPos >= memory.length) continue;
        const terminator = memory[terminatorPos];
        if (terminator !== 0xFF && terminator !== 0x00) {
            continue;
        }

        // Check remaining unused slots (count + 2 to 6) should be 0xFF or 0x00
        // Be lenient - only reject if we find clearly invalid data (1-151 species IDs)
        for (let i = count + 2; i <= 6; i++) {
            const species = memory[addr + i];
            // If it's a valid species ID, this is probably not unused - reject
            if (species >= 1 && species <= maxSpecies) {
                validSpecies = false;
                break;
            }
            // Accept 0xFF, 0x00, or values > maxSpecies as valid padding
        }

        if (!validSpecies) continue;

        // Position 7 is unused padding (can be any value, but typically 0x00)
        // We don't need to validate this strictly as it's just padding

        // Additional validation: check that Pokemon data structure looks valid
        // Stored level is at offset 0x03 within each Pokemon structure (starts at offset 0x08)
        // So first Pokemon's stored level is at addr + 0x08 + 0x03 = addr + 0x0B
        // This is a soft check - if level is invalid, we reduce confidence but don't reject
        let levelValid = false;
        if (addr + 0x0B < memory.length) {
            const firstPokemonLevel = memory[addr + 0x0B];
            // Level should be 1-100 for valid Pokemon
            if (firstPokemonLevel >= 1 && firstPokemonLevel <= 100) {
                levelValid = true;
            }
        }

        // Calculate confidence based on data validity
        let score = 50; // Base score for matching structure

        // Bonus for common Pokemon in party
        const commonStarters = [1, 4, 7, 25]; // Bulbasaur, Charmander, Squirtle, Pikachu
        if (speciesList.some(s => commonStarters.includes(s))) {
            score += 20;
        }

        // Bonus for party count > 1 (more likely to be real data)
        if (count > 1) score += 10;

        // Bonus if level validation passed (indicates fully loaded Pokemon data)
        if (levelValid) score += 15;

        // Bonus if address is in expected range
        if (generation === 1) {
            if (addr >= 0xD100 && addr <= 0xD200) {
                score += 15;
                // Extra bonus for being very close to known party address (0xD163)
                if (addr >= 0xD160 && addr <= 0xD170) {
                    score += 10;
                }
            }
        } else if (generation === 2) {
            if (addr >= 0xDC00 && addr <= 0xDD00) {
                score += 15;
                // Extra bonus for being very close to known party address (0xDCD7)
                if (addr >= 0xDCD0 && addr <= 0xDCE0) {
                    score += 10;
                }
            }
        }

        const confidence: 'high' | 'medium' | 'low' =
            score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';

        candidates.push({
            address: `0x${addr.toString(16).toUpperCase()}`,
            confidence,
            preview: `Party of ${count}: ${speciesList.map(s => `#${s}`).join(', ')}`,
            score,
        });
    }

    onProgress?.(100, 'Scan complete! Analyzing results...');

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Debug: Log scan results
    console.log('[MemoryScanner] Scan complete:', {
        candidatesFound: candidates.length,
        topCandidates: candidates.slice(0, 5).map(c => ({
            addr: c.address,
            score: c.score,
            preview: c.preview,
        })),
    });

    if (candidates.length === 0) {
        return {
            success: false,
            config: null,
            confidence: 'low',
            details: 'No party data structure found. Make sure a game is loaded with Pokemon in your party.',
            candidates: [],
        };
    }

    const best = candidates[0];
    return {
        success: true,
        config: {
            baseAddress: best.address,
            offset: '0x00',
            size: `0x${expectedSize.toString(16).toUpperCase()}`,
        },
        confidence: best.confidence,
        details: `Found ${candidates.length} candidate(s). Best match: ${best.preview}`,
        candidates: candidates.slice(0, 5), // Return top 5
    };
}

/**
 * Scan memory for badge data
 * Badges are stored as a bitmask (1 byte for Gen 1, 2 bytes for Gen 2)
 */
export async function scanForBadgeData(
    memory: number[],
    generation: 1 | 2 = 1,
    currentBadgeCount?: number,
    onProgress?: (progress: number, message: string) => void
): Promise<ScanResult> {
    const candidates: ScanCandidate[] = [];
    const maxBadges = generation === 1 ? 8 : 16;
    const byteSize = generation === 1 ? 1 : 2;

    // Search in WRAM area
    const searchStart = 0xD000;
    const searchEnd = 0xE000;
    const totalAddresses = searchEnd - searchStart;

    onProgress?.(0, 'Initializing badge scan...');

    for (let addr = searchStart; addr < searchEnd; addr++) {
        if ((addr - searchStart) % 100 === 0) {
            const progress = ((addr - searchStart) / totalAddresses) * 100;
            onProgress?.(progress, `Scanning address 0x${addr.toString(16).toUpperCase()}...`);
            
            // Add small delay to slow down scan and allow UI to update smoothly
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        let badgeValue: number;
        if (generation === 1) {
            badgeValue = memory[addr];
        } else {
            badgeValue = memory[addr] | (memory[addr + 1] << 8);
        }

        // Count set bits
        const badgeCountFound = countBits(badgeValue);

        // Skip if no badges or all badges (less likely to be correct during normal play)
        if (badgeCountFound === 0 || badgeCountFound === maxBadges) continue;

        // Skip if more than max badges worth of bits are set
        if (badgeValue >= (1 << maxBadges)) continue;

        let score = 30;

        // Strong bonus if badge count matches user's expected count
        if (currentBadgeCount !== undefined && badgeCountFound === currentBadgeCount) {
            score += 40;
        }

        // Bonus for being in expected memory range
        if (generation === 1 && addr >= 0xD350 && addr <= 0xD360) score += 20;
        if (generation === 2 && addr >= 0xD570 && addr <= 0xD580) score += 20;

        // Slight bonus for consecutive badge bits (more likely real badge data)
        if (hasConsecutiveBits(badgeValue)) score += 10;

        const confidence: 'high' | 'medium' | 'low' =
            score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';

        candidates.push({
            address: `0x${addr.toString(16).toUpperCase()}`,
            confidence,
            preview: `${badgeCountFound}/${maxBadges} badges (0x${badgeValue.toString(16).toUpperCase()})`,
            score,
        });
    }

    onProgress?.(100, 'Scan complete! Analyzing results...');

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
        return {
            success: false,
            config: null,
            confidence: 'low',
            details: 'No badge data found. Make sure you have at least one badge.',
            candidates: [],
        };
    }

    const best = candidates[0];
    return {
        success: true,
        config: {
            baseAddress: best.address,
            offset: '0x00',
            size: `0x${byteSize.toString(16).toUpperCase()}`,
        },
        confidence: best.confidence,
        details: `Found ${candidates.length} candidate(s). Best match: ${best.preview}`,
        candidates: candidates.slice(0, 5),
    };
}

/**
 * Scan memory for location/map ID data
 */
export async function scanForLocationData(
    memory: number[],
    generation: 1 | 2 = 1,
    currentMapId?: number,
    onProgress?: (progress: number, message: string) => void
): Promise<ScanResult> {
    const candidates: ScanCandidate[] = [];

    // Valid map ID ranges
    const maxMapId = generation === 1 ? 248 : 255;

    // Search in WRAM area
    const searchStart = 0xD000;
    const searchEnd = 0xE000;
    const totalAddresses = searchEnd - searchStart;

    onProgress?.(0, 'Initializing location scan...');

    for (let addr = searchStart; addr < searchEnd; addr++) {
        if ((addr - searchStart) % 100 === 0) {
            const progress = ((addr - searchStart) / totalAddresses) * 100;
            onProgress?.(progress, `Scanning address 0x${addr.toString(16).toUpperCase()}...`);
            
            // Add small delay to slow down scan and allow UI to update smoothly
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        const mapId = memory[addr];

        // Must be valid map ID
        if (mapId > maxMapId) continue;

        let score = 20;

        // Strong bonus if it matches user's expected map
        if (currentMapId !== undefined && mapId === currentMapId) {
            score += 50;
        }

        // Bonus for being in expected memory range
        if (generation === 1 && addr >= 0xD350 && addr <= 0xD360) score += 25;
        if (generation === 2 && addr >= 0xDCB0 && addr <= 0xDCC0) score += 25;

        // Bonus for common starting locations
        const commonMaps = generation === 1
            ? [0, 1, 2, 3, 40] // Pallet Town, Viridian, Pewter, etc.
            : [0, 1, 2, 3, 4]; // New Bark, Cherrygrove, etc.
        if (commonMaps.includes(mapId)) score += 10;

        // Only include if score is reasonable
        if (score < 30) continue;

        const confidence: 'high' | 'medium' | 'low' =
            score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low';

        candidates.push({
            address: `0x${addr.toString(16).toUpperCase()}`,
            confidence,
            preview: `Map ID: ${mapId} (0x${mapId.toString(16).toUpperCase()})`,
            score,
        });
    }

    onProgress?.(100, 'Scan complete! Analyzing results...');

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
        return {
            success: false,
            config: null,
            confidence: 'low',
            details: 'No location data found. Make sure a game is actively running.',
            candidates: [],
        };
    }

    const best = candidates[0];
    return {
        success: true,
        config: {
            baseAddress: best.address,
            offset: '0x00',
            size: '0x01',
        },
        confidence: best.confidence,
        details: `Found ${candidates.length} candidate(s). Best match: ${best.preview}`,
        candidates: candidates.slice(0, 5),
    };
}

// Helper: count set bits in a number
function countBits(n: number): number {
    let count = 0;
    while (n) {
        count += n & 1;
        n >>= 1;
    }
    return count;
}

// Helper: check if bits are mostly consecutive (e.g., 0b00001111)
function hasConsecutiveBits(n: number): boolean {
    if (n === 0) return false;
    // Fill gaps: if (n & (n + 1)) === 0, all set bits are consecutive from bit 0
    // More lenient: check if there's at most one gap
    const filled = n | (n >> 1);
    return countBits(filled) <= countBits(n) + 1;
}

export type ScanType = 'activeParty' | 'gymBadges' | 'location';

export async function scanMemory(
    type: ScanType,
    memory: number[],
    generation: 1 | 2 = 1,
    hints?: { badgeCount?: number; mapId?: number },
    onProgress?: (progress: number, message: string) => void
): Promise<ScanResult> {
    switch (type) {
        case 'activeParty':
            return scanForPartyData(memory, generation, onProgress);
        case 'gymBadges':
            return scanForBadgeData(memory, generation, hints?.badgeCount, onProgress);
        case 'location':
            return scanForLocationData(memory, generation, hints?.mapId, onProgress);
        default:
            return {
                success: false,
                config: null,
                confidence: 'low',
                details: `Unknown scan type: ${type}`,
            };
    }
}
