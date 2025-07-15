from django.shortcuts import render
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.conf import settings
import razorpay
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

# Create your views here.

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'phone', 'altPhone', 'address', 'city', 'salon')

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'username field is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'No user found with this username'}, status=status.HTTP_404_NOT_FOUND)
        # WARNING: In real applications, never send plain passwords via email!
        password = user.password  # This is hashed, not plain text
        # If you store plain text somewhere (not recommended), use that. Otherwise, you can't send the real password.
        # For demonstration, we will just send the username and a note about password security.
        send_mail(
            'Your Account Information',
            f'Username: {user.username}\nPassword: (We do not store plain passwords. Please contact admin to reset your password.)',
            'aayyusshhpatel000@gmail.com',
            [user.email],
            fail_silently=False,
        )
        return Response({'message': 'An email has been sent to your registered email address.'})

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username_or_email = request.data.get('username') or request.data.get('email')
        if not username_or_email:
            return Response({'error': 'username or email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(username=username_or_email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username_or_email)
            except User.DoesNotExist:
                return Response({'error': 'No user found with this username or email'}, status=status.HTTP_404_NOT_FOUND)
        if not user.email:
            return Response({'error': 'No email address found for this user.'}, status=status.HTTP_400_BAD_REQUEST)
        token = PasswordResetTokenGenerator().make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{request.data.get('frontend_url', 'http://localhost:3000')}/reset-password?uid={uid}&token={token}"
        html_message = f'''
            <p>Click the button below to reset your password:</p>
            <a href="{reset_url}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
        
        '''
        send_mail(
            'Password Reset Request',
            'Click the link to reset your password: {reset_url}',  # plain text fallback
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message
        )
        return Response({'message': 'A password reset link has been sent to your email.'})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not (uidb64 and token and new_password):
            return Response({'error': 'uid, token, and new_password are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid user'}, status=status.HTTP_400_BAD_REQUEST)
        if not PasswordResetTokenGenerator().check_token(user, token):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password has been reset successfully.'})

class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_id = request.data.get('order_id')
        amount = request.data.get('amount')  # Amount in rupees
        if not order_id or not amount:
            return Response({'error': 'order_id and amount are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Convert amount to paise
            amount_paise = int(float(amount) * 100)
            
            # Initialize Razorpay client
            client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
            
            # Create order data
            data = {
                'amount': amount_paise,
                'currency': 'INR',
                'receipt': str(order_id),
                'payment_capture': 1,
                'notes': {
                    'order_id': str(order_id),
                    'test_mode': 'true'  # Indicate this is a test order
                }
            }
            
            # Create Razorpay order
            razorpay_order = client.order.create(data=data)
            
            return Response({
                'razorpay_order_id': razorpay_order['id'],
                'amount': razorpay_order['amount'],
                'currency': razorpay_order['currency'],
                'key_id': settings.RAZORPAY_KEY_ID,
                'order_id': order_id,
                'test_mode': True  # Indicate this is test mode
            })
            
        except Exception as e:
            return Response({
                'error': f'Failed to create Razorpay order: {str(e)}',
                'details': 'Please check your Razorpay credentials and try again'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
