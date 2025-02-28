from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pywebpush import webpush, WebPushException
import json


from schemas.base import NotificationRequest
from settings.keys import(
    VAPID_PRIVATE_KEY,
    VAPID_PUBLIC_KEY,
    VAPID_CLAIMS
)

app = FastAPI()


# Rota para enviar notificações
@app.post("/enviar-notificacao")
async def enviar_notificacao(request: NotificationRequest):
    try:
        # Envia a notificação usando pywebpush
        webpush(
            subscription_info=request.subscription,
            data=json.dumps({"title": request.title, "body": request.body}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS
        )
        return {"message": "Notificação enviada com sucesso!"}
    except WebPushException as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar notificação: {str(e)}")

# Rota para obter a chave pública VAPID
@app.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": VAPID_PUBLIC_KEY}

# Inicia o servidor
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)