import { DetectionRequest } from '../dtos/requests/detect-request'
import { ethers } from 'ethers'
import { authenticator } from 'otplib'

export class TwoFactorAuthService {
    private static readonly HIGH_RISK_THRESHOLD = ethers.parseEther('1.0') // 1 ETH
    private static readonly KNOWN_PROTOCOLS = new Set([
        'uniswap',
        'aave',
        'compound',
        'curve',
        'sushi',
        'balancer'
    ])

    /**
     * Checks if a transaction requires 2FA verification
     * @param request The detection request containing transaction details
     * @returns boolean indicating if 2FA is required
     */
    public static requires2FA(request: DetectionRequest): boolean {
        const { trace, protocolName } = request
        const value = trace.value ? BigInt(trace.value) : BigInt(0)

        // Check if transaction is high value
        if (value > this.HIGH_RISK_THRESHOLD) {
            return true
        }

        // Check if transaction is to a known protocol
        if (protocolName && this.KNOWN_PROTOCOLS.has(protocolName.toLowerCase())) {
            return true
        }

        // Check if transaction involves contract calls
        if (trace.calls && trace.calls.length > 0) {
            return true
        }

        return false
    }

    /**
     * Verifies a 2FA code
     * @param secret The user's 2FA secret
     * @param code The code to verify
     * @returns boolean indicating if the code is valid
     */
    public static verify2FACode(secret: string, code: string): boolean {
        try {
            return authenticator.verify({
                token: code,
                secret: secret
            })
        } catch (error) {
            console.error('Error verifying 2FA code:', error)
            return false
        }
    }

    /**
     * Generates a new 2FA secret
     * @returns The generated secret
     */
    public static generateSecret(): string {
        return authenticator.generateSecret()
    }

    /**
     * Generates a QR code URL for the authenticator app
     * @param secret The 2FA secret
     * @param account The user's account address
     * @returns The QR code URL
     */
    public static generateQRCodeURL(secret: string, account: string): string {
        return authenticator.keyuri(account, 'Venn2FA', secret)
    }
} 