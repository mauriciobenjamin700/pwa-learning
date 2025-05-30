import {JSX} from "react";

import { FormButtonType } from "@/utils/enums";

import styles from "./styles.module.css";

interface FormButtonProps {
    id: string;
    text: string;
    type?: FormButtonType;
    onClick?: () => void;
}

export default function FormButton({
    id,
    text,
    type = FormButtonType.BUTTON,
    onClick,
}: FormButtonProps
): JSX.Element {
    return (
        <button
            className={`${styles.container} btn btn-primary`}
            id={id}
            type={type}
            onClick={onClick}
        >
            {text}
        </button>
    );
}