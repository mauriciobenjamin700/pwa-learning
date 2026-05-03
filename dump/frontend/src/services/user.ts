class UserService {
    private mockUser: UserResponse = {
        id: "1",
        name: "Test User",
        email: "test@test.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    constructor () {
        this.mockUser.updated_at = new Date().toISOString();
    }

    async login(request: UserLogin): Promise<UserResponse> {

        if (!request.email || !request.password) {
            throw new Error('Email and password are required');
        }

        if (
            request.email === this.mockUser.email
        ){
            return this.mockUser
        }

        throw new Error('Invalid email or password');

    }
}


export default UserService