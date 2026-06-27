"""
Sri Pooja Homam API Backend Tests
Tests: Auth, Temples, Poojas, Bookings, Live Streams, Admin CRUD, User Management
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://mandir-admin-portal.preview.emergentagent.com').rstrip('/')

# Test data storage
test_data = {
    "admin_token": None,
    "devotee_token": None,
    "devotee_user": None,
    "temple_id": None,
    "pooja_id": None,
    "booking_id": None,
    "live_stream_id": None,
    "video_id": None,
}

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealth:
    """Health check - run first"""

    def test_api_root(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ API health check passed")


class TestAuth:
    """Authentication flows"""

    def test_01_super_admin_login(self, api_client):
        """Test super admin login with seeded credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "mobile": "9999999999",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["mobile"] == "9999999999"
        test_data["admin_token"] = data["token"]
        print(f"✓ Super admin login successful, role: {data['user']['role']}")

    def test_02_devotee_register(self, api_client):
        """Test devotee registration - returns mocked OTP"""
        mobile = f"9{int(time.time()) % 1000000000}"  # Generate unique mobile
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "full_name": "Test Devotee",
            "mobile": mobile,
            "email": f"test{int(time.time())}@example.com",
            "address": "123 Test Street",
            "city": "Hyderabad",
            "pincode": "500001",
            "password": "Test@123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "otp_mock" in data
        assert data["mobile"] == mobile
        test_data["devotee_mobile"] = mobile
        test_data["devotee_otp"] = data["otp_mock"]
        print(f"✓ Devotee registration successful, OTP: {data['otp_mock']}")

    def test_03_devotee_verify_otp(self, api_client):
        """Test OTP verification - creates devotee account"""
        response = api_client.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "mobile": test_data["devotee_mobile"],
            "otp": test_data["devotee_otp"]
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "devotee"
        assert data["user"]["verified"] == True
        test_data["devotee_token"] = data["token"]
        test_data["devotee_user"] = data["user"]
        print(f"✓ OTP verification successful, user_id: {data['user']['id']}")

    def test_04_auth_me_devotee(self, api_client):
        """Test /auth/me with devotee token"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_data['devotee_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_data["devotee_user"]["id"]
        assert data["role"] == "devotee"
        print(f"✓ /auth/me returned correct devotee user")

    def test_05_auth_me_admin(self, api_client):
        """Test /auth/me with admin token"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "super_admin"
        print(f"✓ /auth/me returned correct admin user")


class TestTemples:
    """Temple endpoints"""

    def test_01_list_temples_public(self, api_client):
        """Test public temple listing"""
        response = api_client.get(f"{BASE_URL}/api/temples")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # Seeded temples
        test_data["temple_id"] = data[0]["id"]
        print(f"✓ Listed {len(data)} temples")

    def test_02_get_temple_detail(self, api_client):
        """Test temple detail endpoint"""
        response = api_client.get(f"{BASE_URL}/api/temples/{test_data['temple_id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_data["temple_id"]
        assert "name" in data
        assert "deity" in data
        print(f"✓ Temple detail: {data['name']}")

    def test_03_create_temple_as_admin(self, api_client):
        """Test temple creation by admin"""
        response = api_client.post(
            f"{BASE_URL}/api/temples",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"},
            json={
                "name": "Test Temple",
                "deity": "Test Deity",
                "location": "Test Location",
                "description": "Test temple for automated testing",
                "logo": "https://via.placeholder.com/200",
                "banner": "https://via.placeholder.com/800",
                "phone": "+91 1234567890"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Temple"
        assert "id" in data
        test_data["test_temple_id"] = data["id"]
        print(f"✓ Created test temple: {data['id']}")


class TestPoojas:
    """Pooja endpoints"""

    def test_01_list_poojas_by_temple(self, api_client):
        """Test pooja listing filtered by temple"""
        response = api_client.get(f"{BASE_URL}/api/poojas?temple_id={test_data['temple_id']}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Seeded poojas per temple
        test_data["pooja_id"] = data[0]["id"]
        print(f"✓ Listed {len(data)} poojas for temple")

    def test_02_get_pooja_detail(self, api_client):
        """Test pooja detail endpoint"""
        response = api_client.get(f"{BASE_URL}/api/poojas/{test_data['pooja_id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_data["pooja_id"]
        assert "name" in data
        assert "price" in data
        print(f"✓ Pooja detail: {data['name']}, price: {data['price']}")

    def test_03_create_pooja_as_admin(self, api_client):
        """Test pooja creation by admin"""
        response = api_client.post(
            f"{BASE_URL}/api/poojas",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"},
            json={
                "temple_id": test_data["temple_id"],
                "name": "Test Pooja",
                "type": "pooja",
                "description": "Test pooja for automated testing",
                "price": 101.0,
                "duration": "30 mins",
                "image": "https://via.placeholder.com/400"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Pooja"
        assert data["price"] == 101.0
        print(f"✓ Created test pooja: {data['id']}")


class TestBookings:
    """Booking and payment flow"""

    def test_01_create_booking_as_devotee(self, api_client):
        """Test booking creation by devotee"""
        response = api_client.post(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {test_data['devotee_token']}"},
            json={
                "pooja_id": test_data["pooja_id"],
                "devotee_name": "Test Devotee",
                "gotra": "Test Gotra",
                "nakshatra": "Ashwini",
                "notes": "Test booking"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending_payment"
        assert data["payment_status"] == "pending"
        assert data["pooja_id"] == test_data["pooja_id"]
        test_data["booking_id"] = data["id"]
        print(f"✓ Created booking: {data['id']}, status: {data['status']}")

    def test_02_confirm_payment_mocked(self, api_client):
        """Test mocked Razorpay payment confirmation"""
        response = api_client.post(
            f"{BASE_URL}/api/bookings/confirm-payment",
            headers={"Authorization": f"Bearer {test_data['devotee_token']}"},
            json={
                "booking_id": test_data["booking_id"],
                "razorpay_payment_id": "pay_test123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "confirmed"
        assert data["payment_status"] == "paid"
        assert "paid_at" in data
        print(f"✓ Payment confirmed (MOCKED), booking status: {data['status']}")

    def test_03_get_my_bookings(self, api_client):
        """Test devotee's booking list"""
        response = api_client.get(
            f"{BASE_URL}/api/bookings/mine",
            headers={"Authorization": f"Bearer {test_data['devotee_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Verify our booking is in the list
        booking_ids = [b["id"] for b in data]
        assert test_data["booking_id"] in booking_ids
        print(f"✓ Retrieved {len(data)} bookings for devotee")

    def test_04_admin_list_all_bookings(self, api_client):
        """Test admin can list all bookings"""
        response = api_client.get(
            f"{BASE_URL}/api/bookings",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin retrieved {len(data)} total bookings")


class TestVideos:
    """Video endpoints"""

    def test_01_list_videos_public(self, api_client):
        """Test public video listing"""
        response = api_client.get(f"{BASE_URL}/api/videos")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # Seeded videos
        print(f"✓ Listed {len(data)} videos")

    def test_02_create_video_as_admin(self, api_client):
        """Test video creation by admin"""
        response = api_client.post(
            f"{BASE_URL}/api/videos",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"},
            json={
                "temple_id": test_data["temple_id"],
                "title": "Test Video",
                "caption": "Test video for automated testing",
                "video_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "thumbnail": "https://via.placeholder.com/400"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Video"
        test_data["video_id"] = data["id"]
        print(f"✓ Created test video: {data['id']}")


class TestLiveStreams:
    """Live stream endpoints with paid-only access"""

    def test_01_list_live_streams_public(self, api_client):
        """Test public live stream listing"""
        response = api_client.get(f"{BASE_URL}/api/live-streams")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # Seeded live stream
        test_data["live_stream_id"] = data[0]["id"]
        print(f"✓ Listed {len(data)} live streams")

    def test_02_access_live_stream_with_paid_booking(self, api_client):
        """Test devotee with paid booking can access live stream"""
        # Devotee has paid booking in test_data["temple_id"]
        response = api_client.get(
            f"{BASE_URL}/api/live-streams/{test_data['live_stream_id']}",
            headers={"Authorization": f"Bearer {test_data['devotee_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_data["live_stream_id"]
        assert "stream_url" in data
        print(f"✓ Devotee with paid booking accessed live stream")

    def test_03_create_live_stream_as_admin(self, api_client):
        """Test live stream creation by admin"""
        response = api_client.post(
            f"{BASE_URL}/api/live-streams",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"},
            json={
                "temple_id": test_data["temple_id"],
                "title": "Test Live Stream",
                "stream_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "is_paid_only": True,
                "is_live": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Live Stream"
        print(f"✓ Created test live stream: {data['id']}")

    def test_04_unpaid_devotee_blocked_from_paid_stream(self, api_client):
        """Test new devotee without payment cannot access paid-only stream"""
        # Register new devotee without booking
        mobile = f"9{int(time.time()) % 1000000000}"
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "full_name": "Unpaid Devotee",
            "mobile": mobile,
            "email": f"unpaid{int(time.time())}@example.com",
            "address": "Test",
            "city": "Test",
            "pincode": "500001",
            "password": "Test@123"
        })
        otp = reg_response.json()["otp_mock"]
        verify_response = api_client.post(f"{BASE_URL}/api/auth/verify-otp", json={
            "mobile": mobile,
            "otp": otp
        })
        unpaid_token = verify_response.json()["token"]

        # Try to access paid-only live stream
        response = api_client.get(
            f"{BASE_URL}/api/live-streams/{test_data['live_stream_id']}",
            headers={"Authorization": f"Bearer {unpaid_token}"}
        )
        assert response.status_code == 403
        assert "paid devotees" in response.json()["detail"].lower()
        print(f"✓ Unpaid devotee correctly blocked from paid-only stream")


class TestUserManagement:
    """User management by super admin"""

    def test_01_list_users_as_admin(self, api_client):
        """Test admin can list users"""
        response = api_client.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least admin + devotee
        print(f"✓ Admin listed {len(data)} users")

    def test_02_deactivate_devotee(self, api_client):
        """Test super admin can deactivate devotee"""
        response = api_client.put(
            f"{BASE_URL}/api/users/{test_data['devotee_user']['id']}/status",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"},
            json={"is_active": False}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] == False
        print(f"✓ Deactivated devotee user")

    def test_03_deactivated_devotee_blocked(self, api_client):
        """Test deactivated devotee cannot access /auth/me"""
        response = api_client.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {test_data['devotee_token']}"}
        )
        assert response.status_code == 403
        assert "deactivated" in response.json()["detail"].lower()
        print(f"✓ Deactivated devotee correctly blocked")

    def test_04_reactivate_devotee(self, api_client):
        """Test super admin can reactivate devotee"""
        response = api_client.put(
            f"{BASE_URL}/api/users/{test_data['devotee_user']['id']}/status",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"},
            json={"is_active": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] == True
        print(f"✓ Reactivated devotee user")


class TestAdminStats:
    """Admin dashboard statistics"""

    def test_01_get_admin_stats(self, api_client):
        """Test admin stats endpoint"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "total_temples" in data
        assert "total_poojas" in data
        assert "total_bookings" in data
        assert "paid_bookings" in data
        assert "revenue" in data
        assert data["total_users"] >= 2
        assert data["total_temples"] >= 2
        assert data["paid_bookings"] >= 1
        assert data["revenue"] > 0
        print(f"✓ Admin stats: {data['total_users']} users, {data['total_temples']} temples, ₹{data['revenue']} revenue")


# Cleanup
class TestCleanup:
    """Cleanup test data"""

    def test_cleanup(self, api_client):
        """Delete test-created data"""
        # Delete test temple (cascade deletes poojas)
        if test_data.get("test_temple_id"):
            api_client.delete(
                f"{BASE_URL}/api/temples/{test_data['test_temple_id']}",
                headers={"Authorization": f"Bearer {test_data['admin_token']}"}
            )
        # Delete test video
        if test_data.get("video_id"):
            api_client.delete(
                f"{BASE_URL}/api/videos/{test_data['video_id']}",
                headers={"Authorization": f"Bearer {test_data['admin_token']}"}
            )
        print("✓ Cleanup completed")
