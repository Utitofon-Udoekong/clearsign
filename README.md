![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Yarn](https://img.shields.io/badge/yarn-%232C8EBB.svg?style=for-the-badge&logo=yarn&logoColor=white)

# Venn 2FA Custom Detector

A custom detector for the Venn Network that implements Two-Factor Authentication (2FA) for high-risk transactions. This detector helps protect users by requiring additional verification for transactions that meet certain risk criteria.

## Features

- 2FA verification for high-risk transactions
- Support for authenticator apps (Google Authenticator, Authy, etc.)
- Risk assessment based on:
  - Transaction value (> 1 ETH)
  - Known protocol interactions (Uniswap, Aave, etc.)
  - Contract calls

## How It Works

1. The detector analyzes incoming transactions to determine if they require 2FA verification
2. For transactions that require 2FA:
   - The user must provide a valid 2FA code
   - The code is verified using TOTP (Time-based One-Time Password)
   - The transaction is only allowed to proceed if verification is successful

## Setup

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the service:
   ```bash
   yarn dev
   ```

## Usage

### For Users

1. Generate a 2FA secret:
   ```typescript
   const secret = TwoFactorAuthService.generateSecret()
   ```

2. Get QR code URL for authenticator app:
   ```typescript
   const qrCodeUrl = TwoFactorAuthService.generateQRCodeURL(secret, userAddress)
   ```

3. Scan QR code with authenticator app

4. When making transactions, include 2FA code in additionalData:
   ```typescript
   {
     additionalData: {
       twoFactorCode: "123456", // Code from authenticator app
       userSecret: "JBSWY3DPEHPK3PXP" // User's 2FA secret
     }
   }
   ```

### For Developers

The detector will automatically:
- Identify high-risk transactions
- Require 2FA verification when needed
- Verify 2FA codes
- Return appropriate responses

## Testing

Run the test suite:
```bash
yarn test
```

## Example Transactions

### High-Value Transaction
```json
{
  "trace": {
    "value": "2000000000000000000", // 2 ETH
    "calls": []
  },
  "protocolName": "unknown",
  "additionalData": {
    "twoFactorCode": "123456",
    "userSecret": "JBSWY3DPEHPK3PXP"
  }
}
```

### Protocol Interaction
```json
{
  "trace": {
    "value": "0",
    "calls": []
  },
  "protocolName": "uniswap",
  "additionalData": {
    "twoFactorCode": "123456",
    "userSecret": "JBSWY3DPEHPK3PXP"
  }
}
```

## Security Considerations

1. 2FA secrets should be stored securely
2. Codes expire after 30 seconds
3. Invalid codes are rejected
4. Missing 2FA data results in transaction rejection

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Table of Contents
- [Introduction](#venn-custom-detector-boilerplate)
- [Quick Start](#quick-start)
- [What's inside?](#-whats-inside)
- [Local development:](#️-local-development)
- [Deploy to production](#-deploy-to-production)

## ✨ Quick start
1. Clone or fork this repo and install dependencies using `yarn install` _(or `npm install`)_
2. Find the detection service under: `src/modules/detection-module/service.ts`

    ```ts
    import { DetectionResponse, DetectionRequest } from './dtos'

    /**
     * DetectionService
     *
     * Implements a `detect` method that receives an enriched view of an
     * EVM compatible transaction (i.e. `DetectionRequest`)
     * and returns a `DetectionResponse`
     *
     * API Reference:
     * https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md
     */
    export class DetectionService {
        /**
         * Update this implementation code to insepct the `DetectionRequest`
         * based on your custom business logic
         */
        public static detect(request: DetectionRequest): DetectionResponse {
            
            /**
             * For this "Hello World" style boilerplate
             * we're mocking detection results using
             * some random value
             */
            const detectionResult = Math.random() < 0.5;


            /**
             * Wrap our response in a `DetectionResponse` object
             */
            return new DetectionResponse({
                request,
                detectionInfo: {
                    detected: detectionResult,
                },
            });
        }
    }
    ```

3. Implement your own logic in the `detect` method
4. Run `yarn dev` _(or `npm run dev`)_
5. That's it! Your custom detector service is now ready to inspect transaction

## 📦 What's inside?
This boilerplate is built using `Express.js`, and written in `TypeScript` using `NodeJS`.  
You can use it as-is by adding your own security logic to it, or as a reference point when using a different programming language.

**Notes on the API**
1. Your detector will get a `DetectionRequest`, and is expected to respond with a `DetectionResponse`

See our [API Reference](https://github.com/ironblocks/venn-custom-detection/blob/master/docs/requests-responses.docs.md) for more information.

## 🛠️ Local Development

**Environment Setup**

Create a `.env` file with:

```bash
PORT=3000
HOST=localhost
LOG_LEVEL=debug
```

**Runing In Dev Mode**
```bash
yarn        # or npm install
yarn dev    # or npm run dev
```

## 🚀 Deploy To Production

**Manual Build**

```bash
yarn build      # or npm run build
yarn start      # or npm run start
```


**Using Docker**
```bash
docker build -f Dockerfile . -t my-custom-detector
```

