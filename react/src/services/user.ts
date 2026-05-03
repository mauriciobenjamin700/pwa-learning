/**
 * Mock user service for the tutorial.
 * Em produção, troque por chamadas reais de auth no backend.
 */
export default class UserService {
  static async login(data: UserLogin): Promise<UserResponse> {
    if (!data.email || !data.password) {
      throw new Error("Email e senha são obrigatórios");
    }
    // Mock: token = user_id em texto plano (ver guias dos backends)
    const fakeUserId = data.email.replace("@", "-").replace(".", "-");
    return {
      id: fakeUserId,
      name: data.email.split("@")[0] ?? data.email,
      email: data.email,
    };
  }
}
