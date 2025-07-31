# React Native Appointment Booking App (Pet Practice)

This is a full-featured appointment booking app built with **React Native**, designed for pet owners and veterinary doctors. The app allows pet owners to book appointments based on diseases, and doctors can manage schedules, approve, reschedule, or transfer emergency appointments.

---

## 🔧 Features

* **User Login** & **Role-Based Navigation** (Doctor / Pet Owner)
* **Doctor Directory with Disease Filters**
* **Book Appointments (with emergency option)**
* **Doctor Schedule Management**
* **Transfer Emergency Appointments**
* **Realtime Appointment Sync via Firebase**
* **Notifications on Appointment Status Changes**
* **Expo + EAS Build for Android APK**
* **Clean, responsive UI**

---

## 📁 Project Structure

```
react-native-appointment/
│
├── assets/                     # Images & logos
├── src/
│   ├── firebase/               # Firebase config
│   └── screens/               # All app screens
├── App.tsx                    # Entry point
├── app.json / eas.json        # Expo + EAS configuration
└── .gitignore / README.md     # Meta files
```

---

## 📆 Libraries Used

### 🛠 Core Tech Stack

* **React Native** (via [Expo](https://expo.dev/))
* **TypeScript**
* **Firebase** (Auth + Firestore + Notifications)
* **Expo Router**

### 📚 NPM Packages

| Package                                 | Purpose                           |
| --------------------------------------- | --------------------------------- |
| `firebase`                              | Firebase Auth & Firestore         |
| `@react-native-firebase/app` (optional) | Firebase integration helper       |
| `expo`                                  | React Native runtime (with tools) |
| `expo-router`                           | Navigation system                 |
| `react-native-safe-area-context`        | UI safe rendering                 |
| `react-native`                          | Mobile UI toolkit                 |

---

## 🔐 Firebase Structure (Firestore)

### `users` collection

```json
{
  "name": "Dr. Smith",
  "role": "doctor",
  "specializations": [{ "name": "Fever" }, { "name": "Injury" }]
}
```

### `appointments` collection

```json
{
  "doctorId": "<uid>",
  "userId": "<uid>",
  "petName": "Tommy",
  "disease": "Fever",
  "isEmergency": true,
  "status": "pending" | "approved" | "rescheduled" | "emergency_pending"
}
```

### `notifications` collection

```json
{
  "userId": "<uid>",
  "message": "Your appointment has been approved!",
  "read": false
}
```

---

## ▶️ How to Run Locally

### 1. Clone the Repo

```bash
git clone https://github.com/Suryanshkapil/react-native-appointment.git
cd react-native-appointment
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the App

```bash
npx expo start
```

> Scan the QR code with your Expo Go app or run on emulator.

---

## 📦 How to Build APK

> Make sure `eas-cli` is installed globally

```bash
npm install -g eas-cli
eas build:configure
eas build -p android --profile preview
```

APK will be generated and downloadable from Expo.

---

## 📅 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute this software for personal or commercial use with proper attribution.
---

## 🙇‍♂️ Developed By

**Suryansh Kapil**
[GitHub](https://github.com/Suryanshkapil)
