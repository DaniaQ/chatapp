import React from "react";
import styles from "../styles/Message.module.css";
import _uniqueId from 'lodash/uniqueId';

export default function Message({ message, isMe }) {
    let id = _uniqueId("prefix-");
  return (
    <div
        key={id} 
      className={
        isMe ? styles.sentMessageContainer : styles.receivedMessageContainer
      }
    >
      <p className={styles.senderText}>{message.owner}</p>
      <div className={isMe ? styles.sentMessage : styles.receivedMessage}>
        <p>{message.message}</p>
      </div>
    </div>
  );
}
