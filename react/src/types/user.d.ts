export {};

declare global {
  interface UserResponse {
    id: string;
    name: string;
    email: string;
  }

  interface UserLogin {
    email: string;
    password: string;
  }
}
