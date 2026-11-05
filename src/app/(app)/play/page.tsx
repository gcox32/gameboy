"use client";

import { useRef, useEffect, RefObject } from 'react';
import { EmulatorProvider, useEmulator } from '@/contexts/EmulatorContext';
import { useMobileImmersive } from '@/hooks/useMobileImmersive';
import Console from '@/components/console/GameConsole';
import FullScreenContainer from '@/components/layout/FullScreenContainer';
import NowPlaying from '@/components/layout/NowPlaying';
import SessionBar from '@/components/layout/SessionBar';
import MobileControls from '@/components/mobile/MobileControls';
import MobileConsole from '@/components/mobile/MobileConsole';
import ConfirmModal from '@/components/modals/utilities/ConfirmModal';
import SaveStateModal from '@/components/modals/SaveStateManagement/SaveStateModal';
import styles from './play.module.css';
import SkyBackground from '@/components/layout/SkyBackground';
import { TRANSITION_DURATION } from '@/lib/transition';

function PlayScreen() {
	const {
		isEmulatorOn,
		mainCanvasRef,
		confirmModalMessage,
		confirmModalProps,
		saveStateModalProps,
	} = useEmulator();
	const skyContainerRef = useRef<HTMLDivElement>(null);

	// Mobile immersive mode - handles fullscreen, orientation lock, PWA detection
	const { isMobile } = useMobileImmersive();

	// Starts at the bottom of the sky, then drifts up as the page arrives
	useEffect(() => {
		const el = skyContainerRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
		const timer = setTimeout(() => {
			el.scrollTo({ top: 0, behavior: 'smooth' });
		}, TRANSITION_DURATION - 500);
		return () => clearTimeout(timer);
	}, []);

	return (
		<SkyBackground ref={skyContainerRef}>
			<div className={styles.playContainer}>
				{!isMobile && (
					<Console
						isEmulatorOn={isEmulatorOn}
						mainCanvasRef={mainCanvasRef as RefObject<HTMLCanvasElement>}
					/>
				)}
				{isMobile && (
					<MobileConsole
						mainCanvasRef={mainCanvasRef as RefObject<HTMLCanvasElement>}
						isEmulatorOn={isEmulatorOn}
					/>
				)}
				<FullScreenContainer />
				<SessionBar />
				<NowPlaying />
				<MobileControls />
				<ConfirmModal
					isOpen={confirmModalProps.isOpen}
					onClose={confirmModalProps.onClose}
					onConfirm={confirmModalProps.onConfirm}
					skipConfirmation={confirmModalProps.skipConfirmation}
					toggleSkipConfirmation={confirmModalProps.toggleSkipConfirmation}
				>
					{confirmModalMessage}
				</ConfirmModal>
				<SaveStateModal
					isOpen={saveStateModalProps.isOpen}
					onClose={saveStateModalProps.onClose}
					onConfirm={saveStateModalProps.onConfirm}
					initialData={saveStateModalProps.initialData}
				/>
			</div>
		</SkyBackground>
	);
}

export default function PlayPage() {
	return (
		<EmulatorProvider>
			<PlayScreen />
		</EmulatorProvider>
	);
}
