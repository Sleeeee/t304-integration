from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response


class RegisterView(APIView):
    def post(self, request):
        return Response({"message": "User registration endpoint"})
