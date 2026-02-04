# PayFast Payment Integration Guide

## Overview
PayFast payment integration has been added to the SA Player mobile app. This allows users to make payments for product purchases and bids through PayFast's secure payment gateway.

## Architecture

### Backend (Server)
- **Location**: `server/src/payment/payfastRouter.ts`
- **Endpoints**:
  - `POST /payment/create-payment` - Creates payment and generates signature
  - `POST /payment/itn` - Handles PayFast ITN (Instant Transaction Notification) callbacks

### Frontend (React Native)
- **Component**: `app/src/components/payment/PayFastPayment.tsx`
- **Integration Points**:
  - Product screen "Buy Now" button
  - Product screen "Bid Now" button
  - Any other purchase flows

## Configuration

### Merchant Credentials
- **Merchant ID**: `31957853`
- **Merchant Key**: `crrh4hjrcxuzt`
- **Sandbox Mode**: Currently enabled for testing

### Environment Variables (Backend)
Add to `server/.env.local`:
```env
PAYFAST_MERCHANT_ID=31957853
PAYFAST_MERCHANT_KEY=crrh4hjrcxuzt
PAYFAST_PASSPHRASE=  # Optional, if set in PayFast dashboard
PAYFAST_SANDBOX=true  # Set to false for production
BACKEND_URL=http://localhost:3050  # Your backend URL
```

### Environment Variables (Frontend)
Add to `app/.env` or Expo config:
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3050
```

## Payment Flow

### 1. User Initiates Payment
- User taps "Buy Now" or "Bid Now" on Product screen
- `PayFastPayment` modal opens

### 2. Create Payment Request
- Frontend calls `POST /payment/create-payment` with:
  - `amount`: Payment amount
  - `itemName`: Product name
  - `itemDescription`: Product description
  - `userEmail`: User's email (optional)
  - `userNameFirst`: User's first name (optional)
  - `userNameLast`: User's last name (optional)

### 3. Backend Generates Payment
- Backend creates payment parameters
- Generates MD5 signature securely
- Returns payment URL and form data

### 4. WebView Payment
- Frontend loads PayFast payment page in WebView
- User completes payment on PayFast
- PayFast redirects to success/cancel URLs

### 5. Payment Callback
- PayFast sends ITN to `/payment/itn`
- Backend verifies signature
- Updates order status
- Returns 200 OK to PayFast

## Integration Points

### Product Screen
```typescript
<PayFastPayment
  visible={isPaymentModalVisible}
  amount={buyNowPrice}
  itemName={formattedName}
  itemDescription={displayDescription}
  onSuccess={(paymentData) => {
    // Handle successful payment
    // - Update order status
    // - Notify seller
    // - Navigate to confirmation
  }}
  onCancel={() => {
    // Handle cancelled payment
  }}
/>
```

## Security Notes

### ⚠️ Important
- **Merchant Key** is stored on backend only (never in client)
- **Signature generation** happens server-side
- **ITN verification** ensures payment authenticity
- **Amount verification** prevents tampering

### Production Checklist
1. ✅ Move credentials to environment variables
2. ✅ Set `PAYFAST_SANDBOX=false` for production
3. ✅ Update `BACKEND_URL` to production URL
4. ✅ Configure PayFast ITN URL in PayFast dashboard
5. ✅ Whitelist PayFast IP ranges for ITN endpoint
6. ✅ Implement order status updates in ITN handler
7. ✅ Add user email/name from actual user profile
8. ✅ Test with real PayFast sandbox account

## Testing

### Sandbox Testing
1. Use PayFast sandbox credentials
2. Test with PayFast test cards:
   - **Success**: 4000 0000 0000 0002
   - **Decline**: 4000 0000 0000 0069
   - **3D Secure**: 4000 0000 0000 3220

### Test Flow
1. Open Product screen
2. Tap "Buy Now"
3. PayFast modal opens
4. Enter test card details
5. Complete payment
6. Verify success callback

## API Reference

### POST /payment/create-payment
**Request Body**:
```json
{
  "amount": 150.00,
  "itemName": "Shining Charizard",
  "itemDescription": "Premium card",
  "userEmail": "user@example.com",
  "userNameFirst": "John",
  "userNameLast": "Doe"
}
```

**Response**:
```json
{
  "success": true,
  "paymentUrl": "https://sandbox.payfast.co.za/eng/process",
  "paymentParams": {
    "merchant_id": "31957853",
    "merchant_key": "...",
    "amount": "150.00",
    "item_name": "Shining Charizard",
    "signature": "...",
    ...
  },
  "mPaymentId": "pf_1234567890_abc123"
}
```

### POST /payment/itn
**Request**: PayFast POSTs payment data
**Response**: `200 OK` (always return 200 to PayFast)

## Troubleshooting

### Common Issues

1. **Signature Mismatch**
   - Ensure all required fields are included
   - Check field order (alphabetical)
   - Verify passphrase if set

2. **ITN Not Received**
   - Check ITN URL is publicly accessible
   - Verify PayFast IP whitelist
   - Ensure endpoint returns 200 OK

3. **WebView Not Loading**
   - Check backend URL is correct
   - Verify CORS settings
   - Check network connectivity

## Next Steps

1. **User Profile Integration**: Get user email/name from profile
2. **Order Management**: Create orders on payment success
3. **Notification System**: Notify seller on payment
4. **Order History**: Track completed payments
5. **Refund Handling**: Implement refund flow if needed
