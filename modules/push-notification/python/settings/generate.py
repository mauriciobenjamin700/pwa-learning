from pywebpush import generate_vapid_keys


private_key, public_key = generate_vapid_keys()
print("Chave Privada:", private_key)
print("Chave Pública:", public_key)