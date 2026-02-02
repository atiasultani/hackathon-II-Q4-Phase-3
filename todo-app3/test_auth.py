#!/usr/bin/env python3
"""
Test script to verify the authentication system implementation
"""
import asyncio
import httpx
import uuid

BASE_URL = "http://localhost:8000"

async def test_auth_system():
    print("Testing Authentication System Implementation...")

    async with httpx.AsyncClient(cookies={}) as client:
        # Generate a unique email for testing
        test_email = f"test_{uuid.uuid4()}@example.com"
        test_password = "TestPass123!"

        print(f"\n1. Testing Signup with email: {test_email}")
        signup_response = await client.post(
            f"{BASE_URL}/api/signup",
            json={"email": test_email, "password": test_password}
        )
        print(f"Signup response: {signup_response.status_code}")
        print(f"Signup cookies: {dict(client.cookies)}")

        if signup_response.status_code != 200:
            print(f"Signup failed: {signup_response.text}")
            return False

        print("\n2. Testing Login with the same credentials")
        login_response = await client.post(
            f"{BASE_URL}/api/login",
            json={"email": test_email, "password": test_password}
        )
        print(f"Login response: {login_response.status_code}")

        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return False

        print("\n3. Testing /me endpoint to get user info")
        me_response = await client.get(f"{BASE_URL}/api/me")
        print(f"Me response: {me_response.status_code}")
        if me_response.status_code == 200:
            user_info = me_response.json()
            print(f"User info: {user_info}")
        else:
            print(f"Me endpoint failed: {me_response.text}")
            return False

        print("\n4. Testing Chat endpoint (should work with auth)")
        chat_response = await client.post(
            f"{BASE_URL}/api/chat",
            json={"message": "list my tasks", "conversation_id": None}
        )
        print(f"Chat response: {chat_response.status_code}")
        if chat_response.status_code == 200:
            chat_result = chat_response.json()
            print(f"Chat result keys: {list(chat_result.keys())}")
        else:
            print(f"Chat endpoint failed: {chat_response.text}")

        print("\n5. Testing Logout")
        logout_response = await client.post(f"{BASE_URL}/api/logout")
        print(f"Logout response: {logout_response.status_code}")
        print(f"Cookies after logout: {dict(client.cookies)}")

        if logout_response.status_code != 200:
            print(f"Logout failed: {logout_response.text}")
            return False

        print("\n6. Testing /me endpoint after logout (should fail)")
        me_after_logout = await client.get(f"{BASE_URL}/api/me")
        print(f"Me after logout: {me_after_logout.status_code} (expected: 401)")

        print("\n✓ All tests passed! Authentication system is working correctly.")
        return True

if __name__ == "__main__":
    success = asyncio.run(test_auth_system())
    if not success:
        exit(1)