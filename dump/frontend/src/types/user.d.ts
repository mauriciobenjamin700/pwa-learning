export {};

declare global {
    type UserRequest = {
        name: string;
        email: string;
        password: string;
    };
    type UserResponse = {
        id: string;
        name: string;
        email: string;
        created_at: string;
        updated_at: string;
    };
    type UserLogin = {
        email: string;
        password: string;
    }
}