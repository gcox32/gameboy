import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { dbConnect } from '@/lib/db';
import { clientIp, limitAuth } from '@/lib/rateLimit';
import { User, Profile } from '@/models';

/** Right password, unverified email. The login page reads `code` to offer a new verification code. */
class UnverifiedEmailError extends CredentialsSignin {
    code = 'unverified';
}

/** Too many attempts for this email or IP; the login page reads `code` to say so. */
class RateLimitedError extends CredentialsSignin {
    code = 'rate_limited';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials, request) {
                if (!credentials?.email || !credentials?.password) return null;

                await dbConnect();

                const limit = await limitAuth('login', {
                    email: String(credentials.email),
                    ip: clientIp(request.headers),
                });
                if (!limit.ok) throw new RateLimitedError();

                const user = await User.findOne({
                    email: String(credentials.email).toLowerCase(),
                });

                if (!user) return null;

                const valid = await bcrypt.compare(
                    String(credentials.password),
                    user.passwordHash
                );
                if (!valid) return null;

                // Checked after the password so verification status isn't revealed to someone without it.
                if (!user.emailVerified) throw new UnverifiedEmailError();

                const profile = await Profile.findOne({ userId: user._id });

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: profile?.username ?? user.email,
                    admin: user.admin ?? false,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.admin = (user as { admin?: boolean }).admin ?? false;
                return token;
            }
            if (!token.id) return token;

            // The token outlives changes to the account, so check it on every use: an admin role
            // removed in the admin view is gone on the next request, and a deleted account is signed out.
            try {
                await dbConnect();
                const current = await User.findById(token.id).select('admin').lean();
                if (!current) return null;
                token.admin = current.admin ?? false;
            } catch (err) {
                console.error('[auth] Could not refresh the session from the database:', err);
                token.admin = false; // fail closed
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
