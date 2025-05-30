import { JSX, useState } from "react";

import Form from "@/components/Form";
import FormInput from "@/components/Form/FormInput";
import FormButton from "@/components/Form/FormButton";
import { FormInputType, FormButtonType } from "@/utils/enums";

import styles from "./styles.module.css";

import UserService from "@/services/user";
import { useSetUser } from "@/hooks/user";

export default function LoginPage(): JSX.Element {

  const setUser = useSetUser();
  const [loginData, setLoginData] = useState<UserLogin>({
    email: "",
    password: ""
  });

  async function handleLogin(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!loginData.email || !loginData.password) {
      alert("Please fill in both email and password.");
      return;
    }
    try{
      const service = new UserService();
      const user = await service.login(loginData)
      setUser(user);

    }catch (error) {
      alert("Login failed. Please check your credentials.");
    }

  }

  return (
    <div className={styles.container}>
      <Form
        onSubmit={handleLogin}
        inputs={
            [
                <FormInput 
                    id="email"
                    name="email"
                    label="E-mail"
                    type={FormInputType.EMAIL}
                    placeholder="Insira seu e-mail"
                    required={true}
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                />,
                <FormInput 
                    id="password"
                    name="password"
                    label="Senha"
                    type={FormInputType.PASSWORD}
                    placeholder="Insira sua senha"
                    required={true}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />,
            ]
        }
        buttons={
            [
                <FormButton 
                    id="login"
                    text="Entrar"
                    type={FormButtonType.SUBMIT}
                />,
                <FormButton 
                    id="register"
                    text="Registrar"
                    type={FormButtonType.BUTTON}
                    onClick={() => alert("Register clicked")}
                />,
            ]
        }
            
      />
    </div>
  );
}