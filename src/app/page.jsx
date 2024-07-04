import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <h1>Welcome to JS GBC</h1>
      <p>Experience the classic Gameboy Color games in your browser!</p>
      <Link href="/auth/login">
        <button>Login to Play</button>
      </Link>
      <Link href="/auth/signup">
        <button>Sign Up</button>
      </Link>
    </div>
  );
}