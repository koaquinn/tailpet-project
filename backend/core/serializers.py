# core/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class TailPetTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["roles"] = list(user.roles.values_list("nombre", flat=True))
        return token
