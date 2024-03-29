import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import { withAuthenticator } from "@aws-amplify/ui-react";
import { listMessages } from "../graphql/queries";
import { createMessage } from "../graphql/mutations";
import Message from "../components/message";
import { onCreateMessage } from "../graphql/subscriptions";
import { getCurrentUser } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from 'aws-amplify/adapter-core';
import { generateClient } from 'aws-amplify/api';
const client = generateClient();

function Home({ messages, user }) {
  const [stateMessages, setStateMessages] = useState([...messages]);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const amplifyUser = await getCurrentUser();
        console.log(amplifyUser)
      } catch (err) {
        console.log("could not get user "+ err)
      }
    };
    fetchUser();

    // Subscribe to creation of message
    const subscription = client.graphql({
      query: onCreateMessage,
    }).subscribe({
      next: ({ data }) => {setStateMessages((stateMessages) => [
        ...stateMessages,
        data.onCreateMessage,
      ]);},
    error: (error) => console.warn(error)});
  }, []);

  useEffect(() => {
    async function getMessages() {
      try {
        const messagesReq = await client.graphql({
          query: listMessages
          // authMode: "AMAZON_COGNITO_USER_POOLS",
        });
        setStateMessages([...messagesReq.data.listMessages.items]);
      } catch (error) {
        console.error(error);
      }
    }
    getMessages();
  }, [user]);

  const handleSubmit = async (event) => {
    // Prevent the page from reloading
    event.preventDefault();

    // clear the textbox
    setMessageText("");

    const input = {
      // id is auto populated by AWS Amplify
      message: messageText, // the message content the user submitted (from state)
      owner: user.username, // this is the username of the current user
    };

    // Try make the mutation to graphql API
    try {
      await client.graphql({
        query: createMessage,
        variables: {
          input: input,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

    return (
      <div className={styles.background}>
        <div className={styles.container}>
          <h1 className={styles.title}> AWS Amplify Live Chat</h1>
          <div className={styles.chatbox}>
            {stateMessages
              // sort messages oldest to newest client-side
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((message) => (
                // map each message into the message component with message as props
                <Message
                  message={message}
                  user={user}
                  isMe={user.username === message.owner}
                  key={message.id}
                />
              ))}
          </div>
          <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.formBase}>
              <input
                type="text"
                id="message"
                name="message"
                autoFocus
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="💬 Send a message to the world 🌎"
                className={styles.textBox}
              />
              <button style={{ marginLeft: "8px" }}>Send</button>
            </form>
          </div>
        </div>
      </div>
    );
  } 


export default withAuthenticator(Home);


export async function getServerSideProps({ req }) {
  // wrap the request in a withSSRContext to use Amplify functionality serverside.

  try {
    // currentAuthenticatedUser() will throw an error if the user is not signed in.
    const user = await runWithAmplifyServerContext({
      nextServerContext: { request: req, response: res },
      operation: (contextSpec) => getCurrentUser(contextSpec)
    });

    // If we make it passed the above line, that means the user is signed in.
    const response = await client.graphql({
      query: listMessages,
      // use authMode: AMAZON_COGNITO_USER_POOLS to make a request on the current user's behalf
    });

    // return all the messages from the dynamoDB
    return {
      props: {
        messages: response.data.listMessages.items,
      },
    };
  } catch (error) {
    // We will end up here if there is no user signed in.
    // We'll just return a list of empty messages.
    return {
      props: {
        messages: [],
      },
    };
  }
}