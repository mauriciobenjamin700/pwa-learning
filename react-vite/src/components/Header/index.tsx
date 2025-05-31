import { JSX, useState } from "react";

import Bell from "./Bell";

import styles from "./styles.module.css";

export default function Header(): JSX.Element {

    const [isBellOn, setIsBellOn] = useState(false);

    return (
        <header className={styles.container}>
            <h1 className={styles.tittle}>APrendendo Sobre PWA</h1>
            <Bell isOn={isBellOn} onClick={() => alert("Sino Clicado")} />
            <button 
                className={styles.button}
                onClick={() => {setIsBellOn(true)}}>
                Ativar Sino
            </button>
            <button
                className={styles.button}
                onClick={() => {setIsBellOn(false)}}>
                Desativar Sino
            </button>
        </header>
    )
}