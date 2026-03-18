# ByteWay / ChatWave

## Current State
- Full blog/photo/video app with admin + sub-admin system
- ByteChat page (VideoCallPage.tsx) with P2P video call and text chat
- Luna AI chatbot with Gemini integration
- Search bar, footer with live clock
- Routes: `/`, `/blog`, `/blog/$id`, `/videos`, `/videocall`, `/admin`
- No general user login system; no ByteChat route; no Messenger-style UI; no E2E encryption

## Requested Changes (Diff)

### Add
- General user login/registration: name + password, stored in localStorage with SHA-256 hashed passwords
- `/bytechat` route pointing to updated ByteChat page
- UserLoginModal component: simple name + password form, toggle between login/register
- Messenger-style chat UI in ByteChat: left panel = peers/contacts, right panel = conversation with messages bottom-up
- "Seen" indicators: double checkmarks (gray = delivered, blue = seen)
- End-to-end encryption: ECDH key exchange + AES-GCM for encrypting messages between two peers
- Ephemeral chat storage: all chat messages stored in sessionStorage, cleared on logout
- Login gate on ByteChat page: users must log in before accessing chat/video features
- UserContext: global React context for current logged-in user state

### Modify
- App.tsx: add `/bytechat` route, update nav
- VideoCallPage.tsx (becomes ByteChat): add login gate, Messenger-style layout, seen indicators, E2E encryption, ephemeral storage
- ByteWayHeader.tsx: show logged-in user name + logout button when user is logged in on ByteChat
- Footer.tsx: no changes needed

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/context/UserContext.tsx` - stores username in sessionStorage, provides login/logout
2. Create `src/frontend/src/components/UserLoginModal.tsx` - login/register modal with name + SHA-256 password
3. Update `VideoCallPage.tsx` to: require login, show Messenger-style chat, add seen indicators, use ECDH+AES-GCM E2E encryption, store chats in sessionStorage (cleared on logout)
4. Update `App.tsx` to add `/bytechat` route and import UserContext provider
5. Update `ByteWayHeader.tsx` to show user login state
