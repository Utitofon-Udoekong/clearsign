import { DetectionRequest, DetectionResponse } from './dtos'
import { TwoFactorAuthService } from './services/two-factor-auth.service'

/**
 * DetectionService
 *
 * Implements a `detect` method that receives an enriched view of an
 * EVM compatible transaction (i.e. `DetectionRequest`)
 * and returns a `DetectionResponse`
 *
 * This implementation adds 2FA verification for high-risk transactions.
 * High-risk transactions are defined as:
 * 1. Transactions with value > 1 ETH
 * 2. Transactions to known protocols (Uniswap, Aave, etc.)
 * 3. Transactions involving contract calls
 */
export class DetectionService {
    /**
     * Inspects the transaction and determines if it requires 2FA verification
     * @param request The detection request containing transaction details
     * @returns DetectionResponse indicating if the transaction is secure
     */
    public static detect(request: DetectionRequest): DetectionResponse {
        // Check if transaction requires 2FA
        const requires2FA = TwoFactorAuthService.requires2FA(request)

        if (!requires2FA) {
            return new DetectionResponse({
                request,
                detectionInfo: {
                    detected: false,
                    message: 'Transaction does not require 2FA verification'
                }
            })
        }

        // Get 2FA code from additional data
        const twoFactorCode = request.additionalData?.twoFactorCode as string
        const userSecret = request.additionalData?.userSecret as string

        if (!twoFactorCode || !userSecret) {
            return new DetectionResponse({
                request,
                detectionInfo: {
                    detected: true,
                    error: true,
                    message: '2FA verification required but missing code or secret'
                }
            })
        }

        // Verify 2FA code
        const isValid = TwoFactorAuthService.verify2FACode(userSecret, twoFactorCode)

        return new DetectionResponse({
            request,
            detectionInfo: {
                detected: !isValid, // detected = true means transaction is blocked
                message: isValid 
                    ? '2FA verification successful'
                    : 'Invalid 2FA code'
            }
        })
    }
}
