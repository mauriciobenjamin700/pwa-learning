import { JSX } from "react";

interface FormProps {
  inputs: JSX.Element[];
}

export default function Form({
  inputs = [],
}: FormProps ): JSX.Element {
  return (
    <form action="">
        <div className="form-group">
          {inputs}
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
    </form>
  )
}