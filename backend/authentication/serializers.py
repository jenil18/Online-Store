from rest_framework import serializers
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'phone', 'altPhone', 'address', 'city', 'salon')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data.get('phone', ''),
            altPhone=validated_data.get('altPhone', ''),
            address=validated_data.get('address', ''),
            city=validated_data.get('city', ''),
            salon=validated_data.get('salon', ''),
        )
        return user 