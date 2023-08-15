import logo from './logo.svg';
import './App.css';
// Amplify auth
import { Amplify } from 'aws-amplify';
import { withAuthenticator, Authenticator } from '@aws-amplify/ui-react';
import awsconfig from './aws-exports';
// auth components
// import { Header } from "./pages/auth/Header";
import { Footer } from "./pages/auth/Footer";
import { SignInHeader } from "./pages/auth/SignInHeader";
import { SignInFooter } from "./pages/auth/SignInFooter";
import "./styles.css";

Amplify.configure(awsconfig);

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Authenticator >
          {({ signOut }) => (
            // eslint-disable-next-line
            <a class="hover-pointer" href="#" onClick={signOut}>
              <img src={logo} className="App-logo" alt="logo" />
            </a>
          )}
        </Authenticator>
      </header>
    </div>
  );
}

export default withAuthenticator(App, {
  components: {
    // Header,
    SignIn: {
      Header: SignInHeader,
      Footer: SignInFooter
    },
    Footer
  },
  hideSignUp: true
});
