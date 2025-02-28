from pydantic import (
    BaseModel,
    Field
)


class NotificationRequest(BaseModel):
    subscription: dict = Field(
        default=None,
        title="Subscription",
        description="Objeto de inscrição do usuário",
        example={"endpoint": "https://example.com/push", "keys": {"p256dh": "base64_encoded_public_key", "auth": "base64_encoded_auth_secret"}}
    )
    title: str = Field(
        default=None,
        title="Title",
        description="Título da notificação",
        examples=["Novo item adicionado ao carrinho"]
    )
    body: str = Field(
        default=None,
        title="Body",
        description="Corpo da notificação",
        examples=["Clique aqui para ver o item"]
    )