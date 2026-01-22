import { useState, useCallback } from 'react';
import { Flex, Text, View, Alert, Heading } from '@/components/ui';
import { useGame } from '@/contexts/GameContext';
import { scanMemory, ScanResult, ScanCandidate, ScanType } from '@/utils/memoryScanner';
import { MemoryWatcherConfig } from '@/types/states';
import buttons from '@/styles/buttons.module.css';
import styles from './styles.module.css';

interface MemoryScannerSectionProps {
    watcherType: ScanType;
    label: string;
    currentConfig: MemoryWatcherConfig;
    generation: 1 | 2;
    onConfigFound: (config: MemoryWatcherConfig) => void;
    hints?: { badgeCount?: number; mapId?: number };
    children?: React.ReactNode;
}

export default function MemoryScannerSection({
    watcherType,
    label,
    currentConfig,
    generation,
    onConfigFound,
    hints,
    children,
}: MemoryScannerSectionProps) {
    const { gameState, inGameMemoryRef } = useGame();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<ScanCandidate | null>(null);

    const canScan = gameState.isPlaying && inGameMemoryRef.current.length > 0;

    const handleScan = useCallback(async () => {
        if (!canScan) return;

        setIsScanning(true);
        setProgress(0);
        setStatusMessage('Initializing scan...');
        setScanResult(null);
        setSelectedCandidate(null);

        try {
            // Small delay to let UI update
            await new Promise(resolve => setTimeout(resolve, 50));

            const result = await scanMemory(
                watcherType,
                inGameMemoryRef.current as number[],
                generation,
                hints,
                (prog, msg) => {
                    setProgress(prog);
                    setStatusMessage(msg);
                }
            );

            setScanResult(result);

            if (result.success && result.config) {
                // Auto-select best candidate
                if (result.candidates && result.candidates.length > 0) {
                    setSelectedCandidate(result.candidates[0]);
                }
            }
        } catch (error) {
            console.error('Scan error:', error);
            setScanResult({
                success: false,
                config: null,
                confidence: 'low',
                details: `Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        } finally {
            setIsScanning(false);
            setStatusMessage('');
        }
    }, [canScan, watcherType, generation, hints, inGameMemoryRef]);

    const handleApplyConfig = useCallback(() => {
        if (selectedCandidate) {
            onConfigFound({
                baseAddress: selectedCandidate.address,
                offset: '0x00',
                size: currentConfig.size, // Keep current size
            });
            setScanResult(null);
            setSelectedCandidate(null);
        }
    }, [selectedCandidate, currentConfig.size, onConfigFound]);

    const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
        switch (confidence) {
            case 'high': return '#22c55e';
            case 'medium': return '#eab308';
            case 'low': return '#ef4444';
        }
    };

    return (
        <>
            {scanResult && !isScanning && scanResult.success && (
                <div className={styles.scanBanner}>
                    <Alert $variation="info" isDismissible={false}>
                        <Text $fontSize="sm">{scanResult.details}</Text>
                    </Alert>
                </div>
            )}

            {scanResult && !isScanning && !scanResult.success && (
                <div className={styles.scanBanner}>
                    <Alert $variation="warning" isDismissible={false}>
                        <Text $fontSize="sm">{scanResult.details}</Text>
                    </Alert>
                </div>
            )}

            <View className={styles.scannerSection}>
            {isScanning ? (
                    <View className={styles.scanProgress}>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className={styles.scanStatus}>
                            <div className={styles.scanIndicator} />
                            <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                                {statusMessage}
                            </Text>
                        </div>
                    </View>
                ) : (
                <div className={styles.scannerHeader}>
                    <Heading as="h6" className={styles.scannerLabel}>{label}</Heading>
                    <button
                        type="button"
                        className={buttons.secondaryButton}
                        onClick={handleScan}
                        disabled={!canScan || isScanning}
                        style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                    >
                        {isScanning ? 'Scanning...' : 'Scan Memory'}
                    </button>
                </div>
                )}

                {!canScan && !isScanning && (
                    <Text $fontSize="sm" $variation="secondary">
                        Start a game to enable memory scanning
                    </Text>
                )}

                {scanResult && !isScanning && scanResult.success && (
                    <View className={styles.scanResults}>
                        {scanResult.candidates && scanResult.candidates.length > 0 && (
                            <View className={styles.candidateList}>
                                <Text $fontWeight="bold" $fontSize="sm">Select address:</Text>
                                {scanResult.candidates.map((candidate, index) => (
                                    <button
                                        key={candidate.address}
                                        type="button"
                                        className={`${styles.candidateItem} ${selectedCandidate?.address === candidate.address ? styles.selected : ''}`}
                                        onClick={() => setSelectedCandidate(candidate)}
                                    >
                                        <Flex $direction="row" $justifyContent="space-between" $alignItems="center" $gap="0.5rem">
                                            <Text $fontWeight="bold" style={{ fontFamily: 'monospace' }}>
                                                {candidate.address}
                                            </Text>
                                            <span
                                                className={styles.confidenceBadge}
                                                style={{ backgroundColor: getConfidenceColor(candidate.confidence) }}
                                            >
                                                {candidate.confidence}
                                            </span>
                                        </Flex>
                                        <Text $fontSize="sm" $variation="secondary">{candidate.preview}</Text>
                                    </button>
                                ))}
                            </View>
                        )}

                        <Flex $direction="row" $gap="0.5rem" $justifyContent="flex-end">
                            <button
                                type="button"
                                className={buttons.secondaryButton}
                                onClick={handleScan}
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                Scan Again
                            </button>
                            <button
                                type="button"
                                className={buttons.primaryButton}
                                onClick={handleApplyConfig}
                                disabled={!selectedCandidate}
                                style={{ padding: '0.5rem 1rem' }}
                            >
                                Apply
                            </button>
                        </Flex>
                    </View>
                )}

                {children}

                <div className={styles.currentConfig}>
                    <Text $fontSize="sm" $variation="secondary">Current:</Text>
                    <Text $fontSize="sm" style={{ fontFamily: 'monospace' }}>
                        {currentConfig.baseAddress}
                        {currentConfig.offset && currentConfig.offset !== '0x00' && ` + ${currentConfig.offset}`}
                        {currentConfig.size && ` (${currentConfig.size})`}
                    </Text>
                </div>
            </View>
        </>
    );
}
