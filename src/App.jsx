import logo from './logo.svg';
import './App.css';
// Amplify auth
import { Amplify } from 'aws-amplify';
import { withAuthenticator, Authenticator } from '@aws-amplify/ui-react';
import awsconfig from './aws-exports';
// auth components
import Arrows from './components/Arrow';
import PartySlots from './components/PartySlots';
import Carts from './components/Carts';
import Console from './components/GBCEmulator';
import PartyModals from './components/PartyModals';
import Settings from './components/Settings';
import { Footer } from "./pages/auth/Footer";
import { SignInHeader } from "./pages/auth/SignInHeader";
import { SignInFooter } from "./pages/auth/SignInFooter";
import './auth.css';

Amplify.configure(awsconfig);

function App() {
  return (
    <div className="App">
      <Arrows />
      <PartySlots />
      <Carts />
      <Console />
      <PartyModals />
      <Settings />
      <header 
        className="App-header" 
        // style={{display:'none'}}
        >
        <Authenticator >
          {({ signOut }) => (
            // eslint-disable-next-line
            <a className="hover-pointer" href="#" onClick={signOut}>
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