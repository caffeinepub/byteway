# ByteWay / ChatWave - ByteChat Enhancements

## Current State
Bytchat page (MessengerPage.tsx) is a full messenger-style app with:
- User login/register with unique ID
- Text chat with E2E encryption (ECDH + AES-GCM)
- Video call via WebRTC (code-based connection)
- Seen indicators, typing indicators, unread badges
- Mobile-first layout

Known issues:
- Screen jumps/scrolls up automatically when typing in chat
- No audio-only call option
- After unique ID connection, call buttons not clearly shown to both parties
- Lag in chat/video
- No chat theme/color customization
- No chat message animations

## Requested Changes (Diff)

### Add
- Audio call feature (WebRTC audio-only, no video)
- After two users connect via unique ID, both see audio call and video call buttons prominently
- Chat theme selector: users can pick from multiple color themes (dark, light, purple, blue, green, sunset etc.)
- Chat bubble color customizer
- Message send/receive animations (slide-in, fade-in)
- Smooth emoji/reaction animations

### Modify
- Fix body/page scroll when typing in chat input -- input must be fixed at bottom, page must NOT scroll up
- Fix keyboard appearing on mobile causing page jump
- Reduce lag: debounce typing events, optimize state updates, use CSS transforms instead of layout changes
- Audio call button clearly visible alongside video call button in chat header after connection
- Improve WebRTC ICE handling for faster connection

### Remove
- Nothing removed

## Implementation Plan
1. Fix scroll/jump bug: use `position: fixed` or `position: sticky` for chat input, prevent `window.scrollTo` interference, lock body scroll only in chat view
2. Add audio call: new WebRTC mode with `audio: true, video: false`, separate audio call UI with mute/end buttons
3. Add call buttons after unique ID connection: show Audio Call + Video Call buttons in chat header when a peer is connected
4. Theme/color system: store selected theme in localStorage, provide 6-8 preset themes with different bubble colors and backgrounds, add theme picker panel in chat settings
5. Message animations: CSS keyframes for incoming/outgoing message slide-in
6. Performance: batch state updates, use `useCallback`/`useMemo`, reduce re-renders
