import '@/styles/globals.css'
import {Amplify} from "aws-amplify";
import { generateClient } from 'aws-amplify/api';
import config from '../../amplifyconfiguration.json';
Amplify.configure(config, {ssr: true});
import '@aws-amplify/ui-react/styles.css';

const client = generateClient();

function MyApp ({ Component, pageProps}) {
  return <Component { ...pageProps} />;
}

export default MyApp;