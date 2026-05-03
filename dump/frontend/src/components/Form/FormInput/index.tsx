import { JSX } from "react";

import { FormInputType } from "@/utils/enums";

import styles from "./styles.module.css";

interface FormInputProps {
    id: string;
    name: string;
    label: string;
    type?: FormInputType;
    placeholder?: string;
    required?: boolean;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * FormInput component for rendering an input field with label.
 * @param {FormInputProps} props - The properties for the input field.
 * @param {string} props.id - The unique identifier for the input field.
 * @param {string} props.name - The name attribute for the input field.
 * @param {string} props.label - The label text for the input field.
 * @param {FormInputType} [props.type=FormInputType.TEXT] - The type of the input field (default is text).
 * @param {string} [props.placeholder=""] - The placeholder text for the input field.
 * @param {boolean} [props.required=false] - Whether the input field is required (default is false).
 * @param {string} [props.value] - The value of the input field (optional).
 * @param {function} [props.onChange] - The function to call when the input value changes (default is an empty function).
 * @returns {JSX.Element} The rendered input field with label.
 */
export default function FormInput({
    id,
    name,
    label,
    type = FormInputType.TEXT,
    placeholder = "",
    required = false,
    value = "",
    onChange = () => {},
}: FormInputProps): JSX.Element {
  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <input
        className={styles.input}
        type={type} 
        id={id} 
        name={name} 
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        autoComplete={type === FormInputType.PASSWORD ? "current-password" : "off"}
        autoFocus={type === FormInputType.TEXT && !value}
        aria-label={label}
        aria-required={required ? "true" : "false"}
        aria-invalid={required && !value ? "true" : "false"}
        aria-describedby={`${id}-description`}
        aria-controls={`${id}-error`}
        aria-haspopup={false}
        aria-expanded={false}
        aria-live="polite"
        aria-atomic="true"
        aria-autocomplete="none"
      />
    </div>
  );
}