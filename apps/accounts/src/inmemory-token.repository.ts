import { TokenRepository } from "./interfaces/token-repository.interface.js";

export class InMemoryTokenRepository implements TokenRepository {
    private revokedTokens = new Set<string>()

    isRevoked(jti: string): boolean {
        return this.revokedTokens.has(jti)
    }

    revoke(jti: string): void {
        this.revokedTokens.add(jti)
    }
}
