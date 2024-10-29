import Link from 'next/link';
import '@/styles/auth.css';

export default function Home() {
  return (
    <div className="container">
      <h1 className="title">Welcome to JS GBC</h1>
      <p className="description">Experience the classic Gameboy Color games in your browser!</p>
      <div className="button-container">
        <Link href="/auth/login">
          <button className="button">Login</button>
        </Link>
        <Link href="/auth/signup">
          <button className="button">Sign Up</button>
        </Link>
      </div>
    </div>
  );
}