import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { User, Profile } from '@/models';

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                await dbConnect();

                const user = await User.findOne({
                    email: String(credentials.email).toLowerCase(),
                });

                if (!user) return null;

                if (!user.emailVerified) {
                    throw new Error('Please verify your email before logging in.');
                }

                const valid = await bcrypt.compare(
                    String(credentials.password),
                    user.passwordHash
                );
                if (!valid) return null;

                const profile = await Profile.findOne({ userId: user._id });

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: profile?.username ?? user.email,
                    admin: profile?.admin ?? false,
                };
            },
        }),
    ],

    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.admin = (user as { admin?: boolean }).admin ?? false;
            }
            return token;
        },
        session({ session, token }) {
            session.user.id = token.id as string;
            session.user.admin = token.admin as boolean;
            return session;
        },
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    session: { strategy: 'jwt' },
});
