'use client';

import { Amplify } from 'aws-amplify';
import outputs from '../../../amplify_outputs.json';
import '@/styles/auth.css';

Amplify.configure(outputs);

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}