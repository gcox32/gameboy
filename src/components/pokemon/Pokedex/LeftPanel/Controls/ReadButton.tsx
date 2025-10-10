"use client";

import { useCallback, useEffect, useState } from "react";
import styles from './styles.module.css';

interface ReadButtonProps {
    text: string;
    isOwned?: boolean;
}

export default function ReadButton({ text, isOwned = false }: ReadButtonProps) {

    const [supported, setSupported] = useState(false);

    useEffect(() => setSupported(!!window.speechSynthesis), []);

    const speak = useCallback(() => {
        const synth = window.speechSynthesis;
        if (!synth || !isOwned) return;

        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);

        // Try for a neutral/robotic English voice
        const voices = synth.getVoices();
        const v =
            voices.find(v => /en(-|_)?/i.test(v.lang) && /microsoft|google|samantha|ava|fred|daniel|zira|david/i.test(v.name)) ??
            voices.find(v => /en(-|_)?/i.test(v.lang));
        if (v) u.voice = v;

        // Dexter-ish vibe
        u.rate = 0.95;
        u.pitch = 0.85;

        synth.speak(u);
    }, [text, isOwned]);

    if (!supported) return null;

    return (
        <button className={styles.readButton} onClick={speak}></button>
    );
}