import { JSX, useState, useEffect } from "react";
import styles from "./styles.module.css";

import ICONS from "@/assets/icons";

interface BellProps {
    isOn?: boolean;
    onClick?: () => void;
}

export default function Bell({
    isOn = false,
    onClick = () => {}
}: BellProps ): JSX.Element {
    const [toggle, setToggle] = useState(false);
    const defaultInterval = 300; // 300 milliseconds

    useEffect(() => {
        if (!isOn) {
            setToggle(false);
            return;
        }
        const interval = setInterval(() => {
            setToggle((prev) => !prev);
        }, defaultInterval);
        return () => clearInterval(interval);
    }, [isOn]);

    const icon = isOn
        ? (toggle ? ICONS.bellOn : ICONS.bellOff)
        : ICONS.bellOff;

    return (
        <div className={styles.container}>
            <button
                onClick={onClick}
                className={styles.button}
            >
                <img
                    src={icon}
                    alt="Bell Icon"
                    className={styles.icon}
                />
            </button>
        </div>
    )
}