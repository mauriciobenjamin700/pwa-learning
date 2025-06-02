import { JSX } from "react";

import styles from "./styles.module.css";

interface FormProps {
  inputs: JSX.Element[];
  buttons: JSX.Element[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function Form({
  inputs,
  buttons,
  onSubmit
}: FormProps ): JSX.Element {
  return (
    <form className={styles.container} onSubmit={onSubmit}>
        <div className={styles.inputContainer}>
          {inputs}
        </div>
        <div className={styles.buttonContainer}>
          {buttons}
        </div>
    </form>
  )
}