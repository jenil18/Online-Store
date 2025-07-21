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

    def remove_non_ascii(self, text):
        return ''.join(i if ord(i) < 128 else ' ' for i in str(text))

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
            self.remove_non_ascii('Your Account Information'),
            self.remove_non_ascii(f'Username: {user.username}\nPassword: (We do not store plain passwords. Please contact admin to reset your password.)'),
            self.remove_non_ascii('shreekrishnabeautyproducts@gmail.com'),
            [self.remove_non_ascii(user.email)],
            fail_silently=False,
        )
        return Response({'message': 'An email has been sent to your registered email address.'})

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def remove_non_ascii(self, text):
        return ''.join(i if ord(i) < 128 else ' ' for i in str(text))

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
            <div style="width:100%;min-height:100vh;background:linear-gradient(135deg, #f8e4ff 0%, #ffd1e8 100%);padding:40px 20px;font-family:Arial,sans-serif;">
              <div style="max-width:480px;margin:auto;background:linear-gradient(180deg, #ffffff 0%, #fefefe 100%);border-radius:24px;box-shadow:0 12px 40px rgba(214,51,132,0.15);padding:40px 24px;text-align:center;border:1px solid rgba(214,51,132,0.1);">
                <div style="background:linear-gradient(135deg, #ff80b5 0%, #d63384 100%);width:90px;height:90px;margin:0 auto 24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px rgba(214,51,132,0.2);">
                  <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj48cGF0aCBmaWxsPSIjZmZmZmZmIiBkPSJNMjUwIDQ2LjRjLTExMi4zIDAtMjAzLjYgOTEuMy0yMDMuNiAyMDMuNlMxMzcuNyA0NTMuNiAyNTAgNDUzLjZjMTEyLjMgMCAyMDMuNi05MS4zIDIwMy42LTIwMy42UzM2Mi4zIDQ2LjQgMjUwIDQ2LjR6bTAgMzcyLjljLTkzLjkgMC0xNjkuMy03NS40LTE2OS4zLTE2OS4zczc1LjQtMTY5LjMgMTY5LjMtMTY5LjMgMTY5LjMgNzUuNCAxNjkuMyAxNjkuM1MzNDMuOSA0MTkuMyAyNTAgNDE5LjN6Ii8+PHBhdGggZmlsbD0iI2ZmZmZmZiIgZD0iTTI1MCAyMTkuMWMtMTcuMSAwLTMwLjkgMTMuOC0zMC45IDMwLjlzMTMuOCAzMC45IDMwLjkgMzAuOSAzMC45LTEzLjggMzAuOS0zMC45LTEzLjgtMzAuOS0zMC45LTMwLjl6bTAgNDYuNGMtOC42IDAtMTUuNS03LTE1LjUtMTUuNXM3LTE1LjUgMTUuNS0xNS41IDE1LjUgNyAxNS41IDE1LjUtNi45IDE1LjUtMTUuNSAxNS41eiIvPjwvc3ZnPg==" alt="Shree Krishna Beauty Products" style="width:50px;">
                </div>
                <div style="background:linear-gradient(135deg, #fff5f9 0%, #fff 100%);border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid rgba(214,51,132,0.1);">
                  <h2 style="color:#d63384;font-size:28px;margin:0 0 16px;font-weight:700;text-shadow:0 2px 4px rgba(214,51,132,0.1);">Password Reset Request</h2>
                  <p style="font-size:16px;color:#333;margin:0 0 16px;line-height:1.6;">We received a request to reset your password for your <span style="color:#d63384;font-weight:600;">Shree Krishna Beauty Products</span> account.</p>
                  <p style="font-size:15px;color:#666;margin:0 0 24px;line-height:1.5;">If you did not request a password reset, please ignore this email. Otherwise, click the button below to reset your password.</p>
                </div>
                <a href="{reset_url}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg, #ff80b5 0%, #d63384 100%);color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;margin-bottom:24px;box-shadow:0 4px 12px rgba(214,51,132,0.3);transition:all 0.3s ease;border:none;cursor:pointer;">Reset Password</a>
                <div style="background:linear-gradient(135deg, #fff5f9 0%, #fff 100%);border-radius:12px;padding:16px;margin-top:24px;border:1px solid rgba(214,51,132,0.1);">
                  <p style="font-size:14px;color:#666;margin:0;line-height:1.6;">Thank you,<br/><span style="color:#d63384;font-weight:600;">Shree Krishna Beauty Products Team</span></p>
                </div>
                <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(214,51,132,0.1);">
                  <p style="font-size:12px;color:#888;margin:0;line-height:1.5;">This is an automated message, please do not reply to this email.<br/>Link is valid for a limited time only.</p>
                </div>
              </div>
            </div>
        '''
        send_mail(
            self.remove_non_ascii('Password Reset Request'),
            self.remove_non_ascii(f'Click the link to reset your password: {reset_url}'),
            self.remove_non_ascii(settings.DEFAULT_FROM_EMAIL),
            [self.remove_non_ascii(user.email)],
            fail_silently=False,
            html_message=self.remove_non_ascii(html_message)
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
