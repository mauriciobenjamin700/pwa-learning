import { JSX } from "react";
import { FormInputType } from "@/utils/enums";

interface FormInputProps {
    id: string;
    name: string;
    label: string;
    type?: FormInputType;
    placeholder?: string;
    required?: boolean;
}

export default function FormInput({
    id,
    name,
    label,
    type = FormInputType.TEXT,
    placeholder = "",
    required = false,
}: FormInputProps): JSX.Element {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input 
        type={type} 
        id={id} 
        name={name} 
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}