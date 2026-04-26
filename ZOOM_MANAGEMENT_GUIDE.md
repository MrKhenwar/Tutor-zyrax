# Zoom Class Management - Tutor Dashboard

## Overview

The Zoom Class Management feature allows tutors to create and manage secure Zoom meetings directly from the Tutor-zyrax dashboard. This feature ensures that only registered participants with database emails can join the meetings.

## Accessing the Feature

1. **Login**: Navigate to `/tutor-login` and login with your tutor credentials
2. **Access Zoom Management**: Once logged in, navigate to `/zoom-classes`

## Features

### 1. Platform Selection
- Switch between **Zyrax** and **Zylo** platforms
- Each platform has its own set of classes and Zoom meetings

### 2. Create Zoom Meetings
- View all your classes in a grid layout
- Click **"Create Zoom Meeting"** on any class without an active Zoom meeting
- The system will:
  - Create a Zoom meeting via the API
  - Automatically register all active subscribers with valid Zoom emails
  - Return meeting details including Meeting ID, Join URL, and Host Start URL

### 3. View Meeting Details
- For classes with active Zoom meetings, click **"View Meeting Details"**
- See comprehensive meeting information:
  - **Class Name**
  - **Meeting ID**
  - **Number of Registered Users**
  - **Meeting Password** (if applicable)
  - **Host Start URL** (private - for tutor only)
  - **Join URL** (for participants)

### 4. Copy Links
- Easily copy Join URLs and Start URLs to clipboard with one click
- Quick access to start meetings as host

## Security Features

- **Registration Required**: All meetings require registration
- **Email Verification**: Only participants with emails in the database can join
- **Automatic Registration**: Active subscribers are automatically registered when you create a meeting
- **Secure URLs**: Host Start URLs are kept private and should not be shared

## How to Use

### Creating a New Zoom Meeting

1. Log into the tutor dashboard at `/tutor-login`
2. Navigate to `/zoom-classes`
3. Select your platform (Zyrax or Zylo)
4. Find the class you want to create a Zoom meeting for
5. Click the **"Create Zoom Meeting"** button
6. Wait for the meeting to be created (this may take a few seconds)
7. Once created, a success message will appear with the number of users automatically registered
8. The meeting details modal will open automatically

### Viewing Existing Meeting Details

1. Find a class with an active Zoom meeting (marked with **"✅ Zoom Active"**)
2. Click **"View Meeting Details"**
3. Review all meeting information
4. Copy the Join URL to share with participants
5. Use the **"Start Meeting as Host"** button or copy the Host Start URL to start your meeting

### Starting a Class

1. Open the meeting details for your class
2. Click **"Start Meeting as Host"** or copy the Host Start URL
3. This will open Zoom and start you as the host
4. Participants can join using their personalized Join URLs from the app

## API Integration

The feature uses the following API endpoints:

- `GET /{platform}/classes/` - Fetch all classes
- `GET /{platform}/zoom/class/{id}/status/` - Check if a class has a Zoom meeting
- `POST /{platform}/zoom/create-for-class/` - Create a new Zoom meeting for a class

All requests require authentication with the tutor access token.

## Troubleshooting

### "column zyrax_userprofile.zoom_email does not exist" or 500 Internal Server Error
- **Cause**: Database migrations haven't been applied
- **Solution**: Run the following commands in the backend directory:
  ```bash
  cd /path/to/zyrax-main/backend
  ./venv/bin/python manage.py makemigrations
  ./venv/bin/python manage.py migrate
  ```
- This adds the required `zoom_email` field to the UserProfile table

### "Failed to create Zoom meeting"
- Ensure you have a valid tutor access token
- Check that the Zoom credentials are configured in the backend .env file
- Verify the class ID is correct

### "Zoom meeting already exists"
- This means a meeting has already been created for this class
- Click "View Meeting Details" to access the existing meeting information

### "Failed to load classes"
- Check your internet connection
- Verify your tutor access token is still valid
- Try refreshing the page

## Technical Details

### Component: ZoomClassManagement.jsx

**Location**: `/Users/viditrajkhenviditwar/Desktop/Work/Tutor-zyrax/src/ZoomClassManagement.jsx`

**Route**: `/zoom-classes` (requires tutor authentication)

**Key Functions**:
- `fetchClasses()` - Loads all classes with their Zoom meeting status
- `handleCreateZoomMeeting(classId)` - Creates a new Zoom meeting
- `copyToClipboard(text, label)` - Copies text to clipboard

**State Management**:
- Uses `TutorAuthContext` for authentication
- Manages platform selection (zyrax/zylo)
- Tracks loading, error, and success states
- Stores selected meeting details for the modal

## Best Practices

1. **Keep Host Start URLs Private**: Never share your Host Start URL with participants
2. **Share Join URLs**: Only share the Join URL with registered participants
3. **Check Registration Count**: Verify the number of registered users matches your expectations
4. **Create Meetings in Advance**: Create Zoom meetings ahead of time to ensure everything is ready
5. **Test Before Class**: Start the meeting early to ensure everything is working

## Security Notice

- All meetings are configured with registration requirements
- Only users with valid emails in the subscriber database can join
- Each participant gets a personalized join URL through the main app
- Meeting passwords are generated automatically when required
- The system prevents unauthorized access through email verification

## Support

For issues or questions:
- Check the server logs on EC2: `sudo journalctl -u gunicorn -f`
- Verify your tutor token is valid
- Ensure the class_id exists in the database
- Check that Zoom credentials are configured in .env file

---

**Last Updated**: 2026-03-24
**Feature Version**: 1.0
**Compatible with**: Zyrax and Zylo platforms
