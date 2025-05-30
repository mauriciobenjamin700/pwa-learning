import { FormButtonType } from "@/utils/enums";
import {JSX} from "react";

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
            id={id}
            type={type}
            onClick={onClick}
            className="btn btn-primary"
        >
            {text}
        </button>
    );
}